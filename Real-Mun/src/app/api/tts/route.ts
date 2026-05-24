import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";
export const maxDuration = 30;

const DEFAULT_CHAIR_VOICE =
  process.env.EDGE_TTS_CHAIR_VOICE || "en-US-AvaMultilingualNeural";

const Schema = z.object({
  text: z.string().min(1).max(5000),
  voice: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { text, voice } = parsed.data;
  const tts = new MsEdgeTTS();
  await tts.setMetadata(
    voice || DEFAULT_CHAIR_VOICE,
    OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
  );

  const chunks: Buffer[] = [];
  const { audioStream } = tts.toStream(text);

  await new Promise<void>((resolve, reject) => {
    audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    audioStream.on("end", resolve);
    audioStream.on("error", reject);
  });

  const buffer = Buffer.concat(chunks);

  return new Response(buffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "Content-Length": buffer.length.toString(),
    },
  });
}
