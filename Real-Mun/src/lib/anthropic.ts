import Anthropic from "@anthropic-ai/sdk";

export const MODEL_SONNET =
  process.env.ANTHROPIC_MODEL_SONNET || "claude-sonnet-4-6";
export const MODEL_HAIKU =
  process.env.ANTHROPIC_MODEL_HAIKU || "claude-haiku-4-5-20251001";
export const MODEL_OPUS =
  process.env.ANTHROPIC_MODEL_OPUS || "claude-opus-4-5";

export const ANTHROPIC_NOT_CONFIGURED_MESSAGE =
  "No Anthropic API key is configured. Set ANTHROPIC_API_KEY or ANTHROPIC_FOUNDRY_API_KEY + AZURE_FOUNDRY_BASE_URL in .env.local.";

function buildClient(): Anthropic | null {
  const foundryKey = process.env.ANTHROPIC_FOUNDRY_API_KEY;
  const foundryBase = process.env.AZURE_FOUNDRY_BASE_URL;
  const directKey = process.env.ANTHROPIC_API_KEY;

  if (foundryKey && foundryBase) {
    return new Anthropic({
      apiKey: foundryKey,
      baseURL: foundryBase,
      defaultHeaders: { "api-key": foundryKey },
    });
  }

  if (directKey) {
    return new Anthropic({ apiKey: directKey });
  }

  console.warn(
    "[anthropic.ts] No Anthropic key configured. Anthropic will not be available as an LLM provider."
  );
  return null;
}

export const anthropic = buildClient() as Anthropic;

export function isAnthropicConfigured(): boolean {
  return !!(
    (process.env.ANTHROPIC_FOUNDRY_API_KEY && process.env.AZURE_FOUNDRY_BASE_URL) ||
    process.env.ANTHROPIC_API_KEY
  );
}
