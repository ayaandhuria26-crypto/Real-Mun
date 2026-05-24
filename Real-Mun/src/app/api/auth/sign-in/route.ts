import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { verifyCode } from "@/lib/email-codes";
import { validateSignIn, buildSession, encodeSession, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  role: z.enum(["user", "worker"]),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { email, password, role, code } = parsed.data;

  const codeOk = await verifyCode(email, code);
  if (!codeOk) {
    return NextResponse.json(
      {
        error:
          "Incorrect or expired verification code. Please request a new one.",
      },
      { status: 401 }
    );
  }

  const signInResult = validateSignIn(email, password, role);
  if (!signInResult.ok) {
    return NextResponse.json({ error: signInResult.reason }, { status: 401 });
  }

  const session = buildSession(email.toLowerCase(), role);
  const encoded = await encodeSession(session);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encoded, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(session.expiresAt),
    path: "/",
  });

  return NextResponse.json({ ok: true, role });
}
