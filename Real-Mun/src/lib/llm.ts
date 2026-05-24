import { GoogleGenerativeAI } from "@google/generative-ai";
import { anthropic, isAnthropicConfigured, MODEL_SONNET } from "./anthropic";

export const LLM_NOT_CONFIGURED_MESSAGE =
  "No LLM provider is configured. Set at least one of: GEMINI_API_KEY, GROQ_API_KEY, CEREBRAS_API_KEY, or ANTHROPIC_API_KEY in .env.local.";

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

function nonEmpty(text: string): string {
  if (!text || !text.trim()) throw new EmptyResponseError();
  return text.trim();
}

function withTimeout<T>(p: Promise<T>, ms: number, provider: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new TimeoutError(provider)), ms)
    ),
  ]);
}

async function callGemini(opts: CallOpts): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
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
  const result = await model.generateContent(opts.user);
  const text = result.response.text();
  return nonEmpty(text);
}

async function callOpenAICompat(
  opts: CallOpts,
  baseUrl: string,
  apiKey: string,
  model: string,
  providerName: string
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
  });

  if (res.status === 429 || res.status === 503 || res.status === 504) {
    const err = new Error(`${providerName} responded with ${res.status}`);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }

  if (!res.ok) {
    throw new Error(`${providerName} error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  return nonEmpty(text);
}

async function callAnthropic(opts: CallOpts): Promise<string> {
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
  });

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
  call: (opts: CallOpts) => Promise<string>;
};

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  if (process.env.GEMINI_API_KEY) {
    providers.push({ name: "Gemini", call: callGemini });
  }

  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "Groq",
      call: (opts) =>
        callOpenAICompat(
          opts,
          "https://api.groq.com/openai/v1",
          process.env.GROQ_API_KEY!,
          process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          "Groq"
        ),
    });
  }

  if (process.env.CEREBRAS_API_KEY) {
    providers.push({
      name: "Cerebras",
      call: (opts) =>
        callOpenAICompat(
          opts,
          "https://api.cerebras.ai/v1",
          process.env.CEREBRAS_API_KEY!,
          process.env.CEREBRAS_MODEL || "qwen-3-235b-a22b-instruct-2507",
          "Cerebras"
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
  if (status === 429 || status === 503 || status === 504) return true;
  if (err instanceof EmptyResponseError) return true;
  if (err instanceof TimeoutError) return true;
  return false;
}

export async function chat(opts: CallOpts): Promise<string> {
  const PROVIDERS = getProviders();
  if (PROVIDERS.length === 0) throw new Error(LLM_NOT_CONFIGURED_MESSAGE);

  let lastErr: unknown;
  for (const provider of PROVIDERS) {
    try {
      return await withTimeout(provider.call(opts), 18_000, provider.name);
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err)) throw err;
      console.warn(`[llm] ${provider.name} failed, trying next:`, (err as Error).message);
    }
  }
  throw lastErr;
}

export async function chatJson<T>(opts: CallOpts): Promise<T> {
  const raw = await chat({ ...opts, json: true });
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
