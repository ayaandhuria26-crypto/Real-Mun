declare global {
  // eslint-disable-next-line no-var
  var __realmunCodes: Map<string, CodeEntry> | undefined;
}

interface CodeEntry {
  codeHash: string;
  expiresAt: number;
  attempts: number;
}

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getStore(): Map<string, CodeEntry> {
  if (!globalThis.__realmunCodes) {
    globalThis.__realmunCodes = new Map();
  }
  return globalThis.__realmunCodes;
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashCode(code: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(code)
  );
  return Buffer.from(buf).toString("hex");
}

export async function saveCode(email: string, code: string): Promise<void> {
  const store = getStore();
  const codeHash = await hashCode(code);
  store.set(email.toLowerCase(), {
    codeHash,
    expiresAt: Date.now() + CODE_TTL_MS,
    attempts: 0,
  });
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  const store = getStore();
  const key = email.toLowerCase();
  const entry = store.get(key);

  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return false;
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(key);
    return false;
  }

  entry.attempts += 1;
  const hash = await hashCode(code);
  if (hash !== entry.codeHash) return false;

  store.delete(key);
  return true;
}
