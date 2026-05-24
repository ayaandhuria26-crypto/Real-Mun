import { NextRequest, NextResponse } from "next/server";
import { nextTurn } from "@/lib/conference/orchestrator";
import type { ConferenceState } from "@/lib/conference/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const state: ConferenceState = body.state;

  if (!state || !state.setup || !state.plan) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  try {
    const result = await nextTurn(state);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Turn failed";
    console.error("[conference/turn]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
