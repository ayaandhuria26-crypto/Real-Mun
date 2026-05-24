import { cookies } from "next/headers";

export type Role = "user" | "worker";

export interface Session {
  username: string;
  role: Role;
  expiresAt: number;
}

export const SESSION_COOKIE = "realmun_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  return process.env.AUTH_SECRET || "real-mun-dev-secret";
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64URL(buf: ArrayBuffer): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64URL(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

export async function encodeSession(session: Session): Promise<string> {
  const payload = `${session.username}|${session.role}|${session.expiresAt}`;
  const key = await getCryptoKey(getSecret());
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}|${toBase64URL(sig)}`;
}

export async function decodeSession(
  raw: string | undefined | null
): Promise<Session | null> {
  if (!raw) return null;
  const parts = raw.split("|");
  if (parts.length !== 4) return null;
  const [username, role, expiresAtStr, sigStr] = parts;

  if (role !== "user" && role !== "worker") return null;

  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) return null;

  const payload = `${username}|${role}|${expiresAtStr}`;
  const key = await getCryptoKey(getSecret());
  const expectedSig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  const actualSig = fromBase64URL(sigStr);
  if (!crypto.subtle.verify) return null;

  const valid = await crypto.subtle.verify("HMAC", key, actualSig as unknown as ArrayBuffer, new TextEncoder().encode(payload));
  if (!valid) return null;

  return { username, role: role as Role, expiresAt };
}

export function buildSession(username: string, role: Role): Session {
  return {
    username,
    role,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
}

export type SignInResult = { ok: true } | { ok: false; reason: string };

export function validateSignIn(
  email: string,
  password: string,
  role: Role
): SignInResult {
  if (!email.includes("@")) {
    return { ok: false, reason: "Invalid email address." };
  }
  if (password.length < 4) {
    return { ok: false, reason: "Password must be at least 4 characters." };
  }

  if (role === "worker") {
    const workerEmail = (process.env.WORKER_EMAIL || "ayaandhuria26@gmail.com").toLowerCase();
    const workerPassword = process.env.WORKER_PASSWORD || "ayaan2026";
    if (email.toLowerCase() !== workerEmail) {
      return { ok: false, reason: "This email is not authorized for worker access." };
    }
    if (password !== workerPassword) {
      return { ok: false, reason: "Incorrect password." };
    }
  }

  return { ok: true };
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  return decodeSession(raw);
}
