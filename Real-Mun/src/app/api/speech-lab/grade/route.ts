import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chat } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 30;

const Schema = z.object({
  transcript: z.string().min(5).max(5000),
  topic: z.string().optional(),
  committee: z.string().optional(),
  durationSec: z.number().optional(),
  wordCount: z.number().optional(),
  fillerCount: z.number().optional(),
});

function buildPrompt(
  transcript: string,
  topic?: string,
  committee?: string,
  durationSec?: number,
  wordCount?: number,
  fillerCount?: number
): string {
  const context = [
    topic ? `Topic: "${topic}"` : "",
    committee ? `Committee: ${committee}` : "",
    durationSec ? `Speaking duration: ${durationSec} seconds` : "",
    wordCount ? `Word count: ${wordCount}` : "",
    fillerCount !== undefined ? `Filler words detected: ${fillerCount}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `You are a senior Model UN speech coach grading a delegate's recorded speech.

${context ? `CONTEXT:\n${context}\n` : ""}
TRANSCRIPT:
"${transcript}"

Grade this speech on 4 dimensions (0–10 each). Be honest and specific — quote the actual transcript in your comments. Return ONLY valid JSON in exactly this shape:

{
  "overall_score": <integer 0-100>,
  "confidence": {
    "score": <0-10>,
    "comment": "<one observation on directness, hedging language, assertiveness>"
  },
  "delivery": {
    "score": <0-10>,
    "comment": "<one observation on filler words, sentence completion, pacing, clarity>"
  },
  "content": {
    "score": <0-10>,
    "comment": "<one observation on policy substance, specificity, facts cited>"
  },
  "register": {
    "score": <0-10>,
    "comment": "<one observation on MUN register: third person, formal language, proper salutation>"
  },
  "highlights": ["<one specific strength, quoting the transcript>"],
  "issues": ["<one or two specific weaknesses with quotes>"],
  "rewrite_example": {
    "original": "<exact weak line from the transcript>",
    "improved": "<a stronger MUN-appropriate version>",
    "why": "<one sentence on why>"
  }
}

Do not fabricate quotes. If the speech is very short, note that as a delivery issue. Return ONLY the JSON object.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { transcript, topic, committee, durationSec, wordCount, fillerCount } = parsed.data;
    const prompt = buildPrompt(transcript, topic, committee, durationSec, wordCount, fillerCount);

    const raw = await chat({
      system:
        "You are a Model UN speech coach. Return only valid JSON with no markdown, no extra text.",
      user: prompt,
      maxTokens: 1500,
      temperature: 0.4,
    });

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid JSON response from grader");
    const grades = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ grades });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Grading failed" },
      { status: 500 }
    );
  }
}
