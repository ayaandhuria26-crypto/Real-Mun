"use client";

import { useEffect, useRef } from "react";
import type { TranscriptEntry } from "@/lib/conference/types";

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function TranscriptFeed({
  transcript,
  speakingId,
  userCountry,
}: {
  transcript: TranscriptEntry[];
  speakingId: string | null;
  userCountry: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const visible = transcript.filter((e) => e.text && e.text.trim().length > 0);

  if (visible.length === 0) {
    return (
      <div
        className="rounded-xl py-10 text-center text-sm"
        style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
      >
        The committee hasn&rsquo;t opened yet…
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
    >
      <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: "460px" }}>
        {visible.map((e) => {
          const isSpeaking = e.id === speakingId;

          if (e.role === "system") {
            return (
              <div key={e.id} className="text-center text-xs italic py-1"
                style={{ color: "var(--color-muted)" }}>
                — {e.text} —
              </div>
            );
          }

          if (e.role === "chair") {
            return (
              <div key={e.id}
                className={`px-4 py-3 rounded-lg transition-all ${isSpeaking ? "ring-2 shadow-lg" : ""}`}
                style={{
                  background: "var(--color-ink)",
                }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: "var(--color-accent)" }}>
                    CHAIR {isSpeaking && "· SPEAKING"}
                  </span>
                  <span className="text-xs" style={{ color: "rgba(245,243,237,0.4)" }}>
                    {formatTimestamp(e.timestamp)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-paper)" }}>
                  {e.text}
                </p>
              </div>
            );
          }

          if (e.role === "user") {
            return (
              <div key={e.id}
                className="ml-12 px-4 py-3 rounded-lg"
                style={{
                  background: "rgba(184,134,11,0.1)",
                  border: "1px solid rgba(184,134,11,0.25)",
                }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: "var(--color-accent)" }}>
                    YOU · {userCountry.toUpperCase()}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                    {formatTimestamp(e.timestamp)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-ink)" }}>
                  {e.text}
                </p>
              </div>
            );
          }

          // Delegate
          return (
            <div key={e.id}
              className={`mr-12 px-4 py-3 rounded-lg transition-all ${isSpeaking ? "ring-2 shadow-lg speaking-ring" : ""}`}
              style={{
                background: "var(--color-card)",
                border: `1px solid ${isSpeaking ? "var(--color-accent)" : "var(--color-border)"}`,
              }}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--color-muted)" }}>
                  {e.speaker.toUpperCase()} {isSpeaking && <span style={{ color: "var(--color-accent)" }}>· SPEAKING</span>}
                </span>
                <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {formatTimestamp(e.timestamp)}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-ink)" }}>
                {e.text}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
