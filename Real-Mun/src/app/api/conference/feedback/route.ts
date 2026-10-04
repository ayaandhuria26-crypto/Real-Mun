import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chatJson, LLM_NOT_CONFIGURED_MESSAGE } from "@/lib/llm";
import { recordSession } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { userFeedbackPrompt } from "@/lib/conference/prompts";
import {
  MAX_SESSION_TRANSCRIPT_CHARS,
  MAX_SESSION_USER_SPEECH_CHARS,
  type TranscriptEntry,
} from "@/lib/conference/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SubScoreSchema = z.object({
  score: z.number().finite().min(0).max(10),
  comment: z.string().trim().min(1).max(800),
});

const FeedbackSchema = z.object({
  overall_score: z.number().finite().min(0).max(100),
  highlights: z.array(z.string().trim().min(1).max(800)).max(8),
  issues: z.array(z.string().trim().min(1).max(800)).max(8),
  delivery: SubScoreSchema,
  content: SubScoreSchema,
  engagement: SubScoreSchema,
  rewrite_example: z.object({
    original: z.string().trim().min(1).max(1200),
    improved: z.string().trim().min(1).max(1200),
    why: z.string().trim().min(1).max(800),
  }),
  next_session_focus: z.array(z.string().trim().min(1).max(800)).length(3),
});

const DelegateSchema = z.object({
  id: z.enum(["d1", "d2", "d3"]),
  country: z.string().trim().min(2).max(100),
  persona: z.enum(["diplomatic", "aggressive", "coalition_builder", "technical", "quiet"]),
  shortDescription: z.string().max(500),
});

const TranscriptEntrySchema = z.object({
  id: z.string().min(1).max(100),
  role: z.enum(["chair", "delegate", "user", "system"]),
  speaker: z.string().min(1).max(100),
  text: z.string().max(10_000),
  timestamp: z.number().finite(),
});

const FeedbackRequestSchema = z.object({
  state: z.object({
    setup: z.object({
      committee: z.string().trim().min(2).max(100),
      topic: z.string().trim().min(2).max(300),
      userCountry: z.string().trim().min(2).max(100),
      delegates: z.tuple([DelegateSchema, DelegateSchema, DelegateSchema]),
    }),
    transcript: z.array(TranscriptEntrySchema).max(500),
    userSpeechCount: z.number().int().min(0).max(500),
    sessionStartedAt: z.number().finite().positive().refine(
      (timestamp) => timestamp <= Date.now(),
      "Session start time cannot be in the future"
    ),
  }).superRefine((state, context) => {
    const transcriptChars = state.transcript.reduce((total, entry) => total + entry.text.length, 0);
    if (transcriptChars > MAX_SESSION_TRANSCRIPT_CHARS) {
      context.addIssue({ code: "custom", path: ["transcript"], message: "Transcript is too large." });
    }
    const userEntries = state.transcript.filter((entry) => entry.role === "user").length;
    if (state.userSpeechCount > userEntries) {
      context.addIssue({ code: "custom", path: ["userSpeechCount"], message: "Speech count does not match transcript." });
    }
    const userSpeechChars = state.transcript.reduce(
      (total, entry) => total + (entry.role === "user" ? entry.text.length : 0),
      0
    );
    if (userSpeechChars > MAX_SESSION_USER_SPEECH_CHARS) {
      context.addIssue({ code: "custom", path: ["transcript"], message: "Session speech limit exceeded." });
    }
  }),
});

function formatEntry(e: TranscriptEntry): string {
  if (e.role === "system") return `[SYSTEM: ${e.text}]`;
  if (e.role === "user") return `>>> USER (${e.speaker}): ${e.text}`;
  return `${e.speaker}: ${e.text}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsedRequest = FeedbackRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }
  const { state } = parsedRequest.data;

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
    }, (value) => FeedbackSchema.safeParse(value));

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
    const isUnconfigured = message === LLM_NOT_CONFIGURED_MESSAGE;
    return NextResponse.json(
      {
        error: isUnconfigured
          ? LLM_NOT_CONFIGURED_MESSAGE
          : "The feedback service is temporarily unavailable. Please try again.",
      },
      { status: isUnconfigured ? 503 : 502 }
    );
  }
}
