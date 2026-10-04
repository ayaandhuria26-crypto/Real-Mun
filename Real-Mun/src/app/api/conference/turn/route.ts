import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nextTurn } from "@/lib/conference/orchestrator";
import {
  MAX_SESSION_TRANSCRIPT_CHARS,
  MAX_SESSION_USER_SPEECH_CHARS,
} from "@/lib/conference/types";
import type { ConferenceState } from "@/lib/conference/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const DelegateSchema = z.object({
  id: z.enum(["d1", "d2", "d3"]),
  country: z.string().trim().min(2).max(100),
  persona: z.enum(["diplomatic", "aggressive", "coalition_builder", "technical", "quiet"]),
  shortDescription: z.string().max(500),
});

const PhaseSchema = z.object({
  type: z.enum([
    "roll_call", "motion_open_debate", "gsl_setup", "opening_speeches",
    "motion_mod_caucus", "moderated_caucus", "motion_unmod_caucus",
    "unmoderated_caucus", "voting", "closing",
  ]),
  topicFocus: z.string().max(300).optional(),
  durationMs: z.number().int().positive().max(3_600_000),
  individualSpeakingTimeSec: z.number().int().positive().max(600).optional(),
  speakerOrder: z.array(z.string().max(100)).max(100).optional(),
  description: z.string().max(1000).optional(),
});

const TranscriptEntrySchema = z.object({
  id: z.string().min(1).max(100),
  role: z.enum(["chair", "delegate", "user", "system"]),
  speaker: z.string().min(1).max(200),
  text: z.string().max(10_000),
  timestamp: z.number().finite().positive(),
});

const ConferenceStateSchema = z.object({
  setup: z.object({
    committee: z.string().trim().min(2).max(100),
    topic: z.string().trim().min(2).max(300),
    userCountry: z.string().trim().min(2).max(100),
    delegates: z.tuple([DelegateSchema, DelegateSchema, DelegateSchema]),
    totalDurationMs: z.number().int().min(60_000).max(3_600_000),
  }),
  plan: z.object({ phases: z.array(PhaseSchema).min(1).max(100) }),
  phaseIndex: z.number().int().min(0).max(100),
  lastOpenedPhaseIndex: z.number().int().min(-1).max(99),
  speakerQueueIndex: z.number().int().min(0).max(10_000),
  turnsThisPhase: z.number().int().min(0).max(10_000),
  phaseStartedAt: z.number().finite().positive(),
  sessionStartedAt: z.number().finite().positive(),
  transcript: z.array(TranscriptEntrySchema).max(500),
  pendingFloorRequest: z.union([
    z.object({ type: z.literal("placard") }),
    z.object({ type: z.literal("motion"), motion: z.string().min(1).max(500), details: z.string().max(1000).optional() }),
    z.null(),
  ]),
  userHasFloor: z.boolean(),
  userSpeechCount: z.number().int().min(0).max(500),
  status: z.enum(["active", "ended"]),
}).superRefine((state, context) => {
  if (state.phaseIndex > state.plan.phases.length) {
    context.addIssue({ code: "custom", path: ["phaseIndex"], message: "Invalid phase index" });
  }
  if (state.lastOpenedPhaseIndex >= state.plan.phases.length) {
    context.addIssue({ code: "custom", path: ["lastOpenedPhaseIndex"], message: "Invalid opened phase index" });
  }
  if (state.userSpeechCount > state.transcript.filter((entry) => entry.role === "user").length) {
    context.addIssue({ code: "custom", path: ["userSpeechCount"], message: "Invalid user speech count" });
  }
  const userSpeechChars = state.transcript.reduce(
    (total, entry) => total + (entry.role === "user" ? entry.text.length : 0),
    0
  );
  const transcriptChars = state.transcript.reduce((total, entry) => total + entry.text.length, 0);
  if (transcriptChars > MAX_SESSION_TRANSCRIPT_CHARS) {
    context.addIssue({ code: "custom", path: ["transcript"], message: "Transcript limit exceeded" });
  }
  if (userSpeechChars > MAX_SESSION_USER_SPEECH_CHARS) {
    context.addIssue({ code: "custom", path: ["transcript"], message: "Session speech limit exceeded" });
  }
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = ConferenceStateSchema.safeParse(body?.state);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  try {
    const state = parsed.data as ConferenceState;
    const result = await nextTurn(state);
    const currentTranscriptChars = state.transcript.reduce((total, entry) => total + entry.text.length, 0);
    const addedTranscriptChars = result.newEntries.reduce((total, entry) => total + entry.text.length, 0);
    if (currentTranscriptChars + addedTranscriptChars > MAX_SESSION_TRANSCRIPT_CHARS) {
      return NextResponse.json({
        response: { kind: "session-ended", reason: "transcript-limit" },
        newEntries: [],
        advance: { status: "ended", endReason: "transcript-limit" },
      });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Turn failed";
    console.error("[conference/turn]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
