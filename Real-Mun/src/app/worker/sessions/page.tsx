"use client";

import { useState, useEffect } from "react";
import Search from "@/components/worker/Search";
import type { SessionReport } from "@/lib/store";

export default function WorkerSessionsPage() {
  const [sessions, setSessions] = useState<SessionReport[]>([]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/worker/sessions")
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []));
  }, []);

  const filtered = sessions.filter(
    (s) =>
      !query ||
      s.username.includes(query) ||
      s.committee.toLowerCase().includes(query.toLowerCase()) ||
      s.topic.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--color-ink)" }}>
          Mock Sessions ({sessions.length})
        </h2>
        <Search value={query} onChange={setQuery} placeholder="Search sessions…" />
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>No sessions found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="card cursor-pointer"
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm" style={{ color: "var(--color-ink)" }}>
                    {s.username}
                  </div>
                  <div className="text-sm" style={{ color: "var(--color-muted)" }}>
                    {s.committee} · {s.userCountry} · {s.userSpeechCount} speeches
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                    {new Date(s.createdAt).toLocaleString()} ·{" "}
                    {Math.round(s.durationMs / 60_000)}min session
                  </div>
                </div>
                <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {expanded === s.id ? "▲" : "▼"}
                </span>
              </div>
              {expanded === s.id && (
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                  <div className="text-sm font-medium mb-2" style={{ color: "var(--color-ink)" }}>
                    Topic: {s.topic}
                  </div>
                  <pre className="text-xs overflow-auto"
                    style={{ color: "var(--color-muted)", maxHeight: 300 }}>
                    {JSON.stringify(s.feedback, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
