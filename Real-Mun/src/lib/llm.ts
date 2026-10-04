import { GoogleGenerativeAI } from "@google/generative-ai";
import { anthropic, isAnthropicConfigured, MODEL_SONNET } from "./anthropic";

export const LLM_NOT_CONFIGURED_MESSAGE =
  "No LLM provider is configured. Set at least one of: GEMINI_API_KEY, GROQ_API_KEY, CEREBRAS_API_KEY, or ANTHROPIC_API_KEY in .env.local.";

const PROVIDER_TIMEOUT_MS = 18_000;
const FALLBACK_BUDGET_MS = 27_000;

type CallOpts = {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
};

class EmptyResponseError extends Error {
  status = 503;
  constructor() {
    super("LLM returned an empty response");
  }
}

class TimeoutError extends Error {
  status = 504;
  constructor(provider: string) {
    super(`LLM call to ${provider} timed out`);
  }
}

class InvalidJsonResponseError extends Error {
  constructor() {
    super("Provider returned JSON that did not match the required schema");
  }
}

type JsonValidation<T> =
  | { success: true; data: T }
  | { success: false };

function nonEmpty(text: string): string {
  if (!text || !text.trim()) throw new EmptyResponseError();
  return text.trim();
}

function withTimeout<T>(
  call: (signal: AbortSignal) => Promise<T>,
  ms: number,
  provider: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(provider));
    }, ms);
    const p = call(controller.signal);
    p.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

async function callGemini(opts: CallOpts, signal: AbortSignal): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: opts.system,
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.7,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  });
  const result = await model.generateContent(opts.user, { signal });
  const text = result.response.text();
  return nonEmpty(text);
}

async function callOpenAICompat(
  opts: CallOpts,
  baseUrl: string,
  apiKey: string,
  model: string,
  providerName: string,
  signal: AbortSignal
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.7,
  };
  if (opts.json) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const err = new Error(`${providerName} error ${res.status}: ${await res.text()}`);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  return nonEmpty(text);
}

async function callAnthropic(opts: CallOpts, signal: AbortSignal): Promise<string> {
  const msg = await anthropic.messages.create({
    model: MODEL_SONNET,
    max_tokens: opts.maxTokens ?? 1024,
    temperature: opts.temperature ?? 0.7,
    system: [
      {
        type: "text",
        text: opts.system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: opts.user }],
  }, { signal });

  let text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  if (opts.json) {
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  return nonEmpty(text);
}

type Provider = {
  name: string;
  call: (opts: CallOpts, signal: AbortSignal) => Promise<string>;
};

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  if (process.env.GEMINI_API_KEY) {
    providers.push({ name: "Gemini", call: callGemini });
  }

  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "Groq",
      call: (opts, signal) =>
        callOpenAICompat(
          opts,
          "https://api.groq.com/openai/v1",
          process.env.GROQ_API_KEY!,
          process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          "Groq",
          signal
        ),
    });
  }

  if (process.env.CEREBRAS_API_KEY) {
    providers.push({
      name: "Cerebras",
      call: (opts, signal) =>
        callOpenAICompat(
          opts,
          "https://api.cerebras.ai/v1",
          process.env.CEREBRAS_API_KEY!,
          process.env.CEREBRAS_MODEL || "qwen-3-235b-a22b-instruct-2507",
          "Cerebras",
          signal
        ),
    });
  }

  if (isAnthropicConfigured()) {
    providers.push({ name: "Anthropic", call: callAnthropic });
  }

  return providers;
}

let _providers: Provider[] | null = null;

function getProviders(): Provider[] {
  if (!_providers) _providers = buildProviders();
  return _providers;
}

export function isLlmConfigured(): boolean {
  return getProviders().length > 0;
}

export function configuredProviders(): string[] {
  return getProviders().map((p) => p.name);
}

function isRetryable(err: unknown): boolean {
  const status = (err as Error & { status?: number })?.status;
  if (
    status === 401 || status === 403 || status === 404 || status === 408 ||
    status === 429 || status === 500 || status === 502 || status === 503 ||
    status === 504
  ) return true;
  if (err instanceof EmptyResponseError) return true;
  if (err instanceof TimeoutError) return true;
  // Provider SDKs do not always expose HTTP status codes consistently.
  // A retired/unknown model or a temporary network failure should still
  // allow the next configured provider to serve the request.
  const message = err instanceof Error ? err.message : String(err);
  if (
    /API_KEY_INVALID|API key not valid|invalid API key|fetch failed|network error|ECONNRESET|ETIMEDOUT/i.test(message)
  ) return true;
  if (/\[(401|403|404|408|429|500|502|503|504)\b|\bHTTP\s+(401|403|404|408|429|500|502|503|504)\b/i.test(message)) return true;
  return false;
}

async function callWithFallback<T>(
  opts: CallOpts,
  parse?: (text: string) => T
): Promise<string | T> {
  const PROVIDERS = getProviders();
  if (PROVIDERS.length === 0) throw new Error(LLM_NOT_CONFIGURED_MESSAGE);

  const deadline = Date.now() + FALLBACK_BUDGET_MS;
  let lastErr: unknown;
  for (const provider of PROVIDERS) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) break;

    try {
      const text = await withTimeout(
        (signal) => provider.call(opts, signal),
        Math.min(PROVIDER_TIMEOUT_MS, remainingMs),
        provider.name
      );
      return parse ? parse(text) : text;
    } catch (err) {
      lastErr = err;
      if (
        !(err instanceof SyntaxError) &&
        !(err instanceof InvalidJsonResponseError) &&
        !isRetryable(err)
      ) throw err;
      console.warn(`[llm] ${provider.name} failed, trying next:`, (err as Error).message);
    }
  }
  throw lastErr ?? new TimeoutError("provider fallback chain");
}

export async function chat(opts: CallOpts): Promise<string> {
  return (await callWithFallback(opts)) as string;
}

export async function chatJson<T>(
  opts: CallOpts,
  validate?: (value: unknown) => JsonValidation<T>
): Promise<T> {
  return (await callWithFallback({ ...opts, json: true }, (raw) => {
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const value = JSON.parse(cleaned) as unknown;
    if (!validate) return value as T;
    const result = validate(value);
    if (!result.success) throw new InvalidJsonResponseError();
    return result.data;
  })) as T;
}
