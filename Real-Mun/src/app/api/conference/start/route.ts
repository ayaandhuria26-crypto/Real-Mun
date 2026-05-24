import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { planSession } from "@/lib/conference/director";
import { getSession } from "@/lib/auth";
import type { ConferenceState } from "@/lib/conference/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const DelegateSchema = z.object({
  id: z.enum(["d1", "d2", "d3"]),
  country: z.string().min(2),
  persona: z.enum(["diplomatic", "aggressive", "coalition_builder", "technical", "quiet"]),
  shortDescription: z.string(),
});

const Schema = z.object({
  committee: z.string().min(2),
  topic: z.string().min(2),
  userCountry: z.string().min(2),
  delegates: z.tuple([DelegateSchema, DelegateSchema, DelegateSchema]),
  totalDurationMs: z.number().int().min(60_000).max(3_600_000).default(30 * 60_000),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const setup = parsed.data;
  const plan = await planSession(setup);

  const now = Date.now();
  const state: ConferenceState = {
    setup,
    plan,
    phaseIndex: 0,
    lastOpenedPhaseIndex: -1,
    speakerQueueIndex: 0,
    turnsThisPhase: 0,
    phaseStartedAt: now,
    sessionStartedAt: now,
    transcript: [],
    pendingFloorRequest: null,
    userHasFloor: false,
    userSpeechCount: 0,
    status: "active",
  };

  return NextResponse.json({ state });
}
