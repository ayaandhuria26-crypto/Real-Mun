import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordBooking } from "@/lib/store";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const Schema = z.object({
  topic: z.string().min(1),
  coach: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { topic, coach, date, time, name, email, notes } = parsed.data;
  const session = await getSession();

  const booking = recordBooking({
    username: session?.username ?? "anonymous",
    topic,
    coach,
    date,
    time,
    name,
    email,
    notes,
  });

  const emailResult = await sendBookingConfirmationEmail({
    to: email,
    name,
    topic,
    coach,
    date,
    time,
    notes,
  });

  const emailNote = emailResult.ok ? undefined : emailResult.reason;

  return NextResponse.json({ ok: true, id: booking.id, emailNote });
}
