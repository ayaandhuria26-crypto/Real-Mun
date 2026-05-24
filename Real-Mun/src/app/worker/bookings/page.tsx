"use client";

import { useState, useEffect } from "react";
import Search from "@/components/worker/Search";
import type { BookingReport } from "@/lib/store";

export default function WorkerBookingsPage() {
  const [bookings, setBookings] = useState<BookingReport[]>([]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/worker/bookings")
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings ?? []));
  }, []);

  const filtered = bookings.filter(
    (b) =>
      !query ||
      b.username.includes(query) ||
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      b.coach.toLowerCase().includes(query.toLowerCase()) ||
      b.topic.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--color-ink)" }}>
          1-on-1 Bookings ({bookings.length})
        </h2>
        <Search value={query} onChange={setQuery} placeholder="Search bookings…" />
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>No bookings found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="card cursor-pointer"
              onClick={() => setExpanded(expanded === b.id ? null : b.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm" style={{ color: "var(--color-ink)" }}>
                    {b.name} ({b.email})
                  </div>
                  <div className="text-sm" style={{ color: "var(--color-muted)" }}>
                    {b.topic} with {b.coach} · {b.date} at {b.time}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                    Booked {new Date(b.createdAt).toLocaleString()}
                  </div>
                </div>
                <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {expanded === b.id ? "▲" : "▼"}
                </span>
              </div>
              {expanded === b.id && b.notes && (
                <div className="mt-4 pt-4 text-sm" style={{ borderTop: "1px solid var(--color-border)", color: "var(--color-muted)" }}>
                  <strong style={{ color: "var(--color-ink)" }}>Notes:</strong> {b.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
