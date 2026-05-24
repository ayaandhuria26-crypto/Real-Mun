import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateCode, saveCode } from "@/lib/email-codes";
import { sendVerificationEmail } from "@/lib/email";

export const runtime = "nodejs";

const Schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { email } = parsed.data;
  const code = generateCode();
  await saveCode(email, code);

  const isDev = process.env.NODE_ENV !== "production";
  const result = await sendVerificationEmail(email, code);

  if (result.ok) {
    return NextResponse.json({ ok: true, sent: true, ...(isDev ? { devCode: code } : {}) });
  } else {
    return NextResponse.json({
      ok: true,
      sent: false,
      devCode: isDev ? code : undefined,
      reason: result.reason,
    });
  }
}
