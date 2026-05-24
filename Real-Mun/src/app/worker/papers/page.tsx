"use client";

import { useState, useEffect } from "react";
import Search from "@/components/worker/Search";
import type { PaperReport } from "@/lib/store";

export default function WorkerPapersPage() {
  const [papers, setPapers] = useState<PaperReport[]>([]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/worker/papers")
      .then((r) => r.json())
      .then((d) => setPapers(d.papers ?? []));
  }, []);

  const filtered = papers.filter(
    (p) =>
      !query ||
      p.username.includes(query) ||
      p.committee.toLowerCase().includes(query.toLowerCase()) ||
      p.country.toLowerCase().includes(query.toLowerCase()) ||
      p.topic.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--color-ink)" }}>
          Position Papers ({papers.length})
        </h2>
        <Search value={query} onChange={setQuery} placeholder="Search papers…" />
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>No papers found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="card cursor-pointer"
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm" style={{ color: "var(--color-ink)" }}>
                    {p.username}
                  </div>
                  <div className="text-sm" style={{ color: "var(--color-muted)" }}>
                    {p.committee} · {p.country} · {p.topic}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                    {new Date(p.createdAt).toLocaleString()}
                  </div>
                </div>
                <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {expanded === p.id ? "▲" : "▼"}
                </span>
              </div>
              {expanded === p.id && (
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                  <div className="text-xs font-mono mb-3 p-3 rounded-lg"
                    style={{ background: "var(--color-surface)", color: "var(--color-muted)", fontFamily: "monospace" }}>
                    {p.paperPreview}…
                  </div>
                  <pre className="text-xs overflow-auto"
                    style={{ color: "var(--color-muted)", maxHeight: 300 }}>
                    {JSON.stringify(p.feedback, null, 2)}
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
