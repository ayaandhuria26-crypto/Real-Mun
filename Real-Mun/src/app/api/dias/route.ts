import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chat } from "@/lib/llm";
import { DIAS_SYSTEM_PROMPT } from "@/lib/dias-knowledge";

export const runtime = "nodejs";
export const maxDuration = 30;

const Schema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .max(20)
    .optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { message, history = [] } = parsed.data;

  const historyText = history
    .map((h) => `${h.role === "user" ? "User" : "Dias"}: ${h.content}`)
    .join("\n");

  const userPrompt = historyText
    ? `${historyText}\nUser: ${message}\n\nDias:`
    : `User: ${message}\n\nDias:`;

  try {
    const reply = await chat({
      system: DIAS_SYSTEM_PROMPT,
      user: userPrompt,
      maxTokens: 800,
      temperature: 0.6,
    });
    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dias request failed";
    console.error("[dias]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
