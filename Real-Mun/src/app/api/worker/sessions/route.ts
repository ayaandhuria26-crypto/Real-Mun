import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listSessions } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "worker") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ sessions: listSessions() });
}
