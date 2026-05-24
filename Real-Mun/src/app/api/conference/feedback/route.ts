import { NextRequest, NextResponse } from "next/server";
import { chatJson } from "@/lib/llm";
import { recordSession } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { userFeedbackPrompt } from "@/lib/conference/prompts";
import type { ConferenceState, TranscriptEntry } from "@/lib/conference/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function formatEntry(e: TranscriptEntry): string {
  if (e.role === "system") return `[SYSTEM: ${e.text}]`;
  if (e.role === "user") return `>>> USER (${e.speaker}): ${e.text}`;
  return `${e.speaker}: ${e.text}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const state: ConferenceState = body.state;

  if (!state || !state.setup) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const { setup, transcript, userSpeechCount, sessionStartedAt } = state;

  const transcriptText = transcript.map(formatEntry).join("\n");

  const userPrompt = `Committee: ${setup.committee}
Topic: ${setup.topic}
User represented: ${setup.userCountry}
User speeches given: ${userSpeechCount}

FULL TRANSCRIPT:
${transcriptText}

Return the feedback JSON now.`;

  try {
    const feedback = await chatJson({
      system: userFeedbackPrompt(),
      user: userPrompt,
      maxTokens: 2500,
      temperature: 0.4,
    });

    const session = await getSession();
    recordSession({
      username: session?.username ?? "anonymous",
      committee: setup.committee,
      topic: setup.topic,
      userCountry: setup.userCountry,
      delegates: setup.delegates,
      userSpeechCount,
      durationMs: Date.now() - sessionStartedAt,
      feedback,
      transcript,
    });

    return NextResponse.json({ feedback });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Feedback generation failed";
    console.error("[conference/feedback]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
