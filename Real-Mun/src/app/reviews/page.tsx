"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FeedbackView from "@/components/FeedbackView";
import SessionFeedback from "@/components/conference/SessionFeedback";
import {
  loadSavedReviews,
  onSavedReviewsUpdated,
  type SavedReview,
} from "@/lib/review-storage";

type Filter = "all" | "paper" | "conference";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<SavedReview[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setReviews(loadSavedReviews());
    refresh();
    return onSavedReviewsUpdated(refresh);
  }, []);

  const filteredReviews = useMemo(
    () => reviews.filter((review) => filter === "all" || review.kind === filter),
    [filter, reviews]
  );

  const paperCount = reviews.filter((review) => review.kind === "paper").length;
  const conferenceCount = reviews.length - paperCount;

  return (
    <div className="max-w-5xl mx-auto px-5 py-12">
      <div className="gold-rule mb-5" />
      <div className="flex flex-wrap items-end justify-between gap-5 mb-8">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.18em] mb-2" style={{ color: "var(--color-accent)" }}>
            Your training archive
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "var(--color-ink)" }}>
            My Reviews
          </h1>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Position papers and mock conference feedback, saved on this device.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/position-paper" className="btn btn-secondary text-sm">Review a paper</Link>
          <Link href="/conference" className="btn btn-primary text-sm">Start a conference</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-7 max-w-md">
        <div className="card !p-4">
          <div className="text-2xl font-bold" style={{ color: "var(--color-ink)" }}>{paperCount}</div>
          <div className="text-xs" style={{ color: "var(--color-muted)" }}>Position papers</div>
        </div>
        <div className="card !p-4">
          <div className="text-2xl font-bold" style={{ color: "var(--color-ink)" }}>{conferenceCount}</div>
          <div className="text-xs" style={{ color: "var(--color-muted)" }}>Mock conferences</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filter saved reviews">
        {([
          ["all", "All reviews", reviews.length],
          ["paper", "Position papers", paperCount],
          ["conference", "Mock conferences", conferenceCount],
        ] as const).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className="rounded-full px-4 py-2 text-sm font-medium border transition"
            style={{
              background: filter === value ? "var(--color-ink)" : "var(--color-card)",
              borderColor: filter === value ? "var(--color-ink)" : "var(--color-border-strong)",
              color: filter === value ? "var(--color-paper)" : "var(--color-muted)",
            }}
          >
            {label} <span className="ml-1 opacity-70">{count}</span>
          </button>
        ))}
      </div>

      {filteredReviews.length === 0 ? (
        <div className="card py-12 text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-xl"
            style={{ background: "var(--color-surface)", color: "var(--color-accent)" }}>
            ✦
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--color-ink)" }}>
            {reviews.length === 0 ? "Your review archive is ready" : "No reviews in this section yet"}
          </h2>
          <p className="text-sm max-w-md mx-auto mb-5" style={{ color: "var(--color-muted)" }}>
            {reviews.length === 0
              ? "Completed position paper grades and mock conference reviews will appear here automatically."
              : "Try another filter, or finish a new practice session to add a review."}
          </p>
          {reviews.length === 0 && (
            <div className="flex justify-center gap-3 flex-wrap">
              <Link href="/position-paper" className="btn btn-secondary text-sm">Review a position paper</Link>
              <Link href="/conference" className="btn btn-primary text-sm">Practice a conference</Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review) => {
            const expanded = expandedId === review.id;
            const score = review.feedback.overall_score;
            const maxScore = review.kind === "paper" ? 50 : 100;
            return (
              <article key={review.id} className="card !p-0 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : review.id)}
                  className="w-full text-left p-5 md:p-6 flex items-center gap-4"
                  aria-expanded={expanded}
                >
                  <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-lg font-bold"
                    style={{ background: "var(--color-surface)", color: "var(--color-accent)" }}>
                    {review.kind === "paper" ? "P" : "M"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--color-accent)" }}>
                        {review.kind === "paper" ? "Position paper" : "Mock conference"}
                      </span>
                      <span className="text-xs" style={{ color: "var(--color-muted)" }}>·</span>
                      <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="font-semibold truncate" style={{ color: "var(--color-ink)" }}>
                      {review.committee} · {review.country}
                    </div>
                    <div className="text-sm truncate" style={{ color: "var(--color-muted)" }}>{review.topic}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-bold" style={{ color: "var(--color-ink)" }}>
                      {Number(score.toFixed(1))}<span className="text-xs font-normal" style={{ color: "var(--color-muted)" }}>/{maxScore}</span>
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>{expanded ? "Close review ↑" : "Open review ↓"}</div>
                  </div>
                </button>

                {expanded && (
                  <div className="px-5 pb-6 md:px-6 space-y-5">
                    <div className="border-t pt-5" style={{ borderColor: "var(--color-border)" }}>
                      {review.kind === "paper" ? (
                        <>
                          <details className="card !p-4 mb-5">
                            <summary className="cursor-pointer text-sm font-medium" style={{ color: "var(--color-ink)" }}>
                              Submitted position paper
                            </summary>
                            <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed"
                              style={{ color: "var(--color-muted)" }}>{review.paper}</pre>
                          </details>
                          <FeedbackView
                            feedback={review.feedback}
                            committee={review.committee}
                            country={review.country}
                            topic={review.topic}
                          />
                        </>
                      ) : (
                        <>
                          <SessionFeedback feedback={review.feedback} />
                          <details className="card !p-4 mt-5">
                            <summary className="cursor-pointer text-sm font-medium" style={{ color: "var(--color-ink)" }}>
                              Your speeches ({review.speeches.length})
                            </summary>
                            <div className="mt-4 space-y-3">
                              {review.speeches.length ? review.speeches.map((speech, index) => (
                                <div key={`${review.id}-speech-${index}`} className="rounded-lg p-3 text-sm whitespace-pre-wrap"
                                  style={{ background: "var(--color-surface)", color: "var(--color-muted)" }}>
                                  <div className="text-xs font-mono mb-1" style={{ color: "var(--color-accent)" }}>Speech {index + 1}</div>
                                  {speech}
                                </div>
                              )) : (
                                <p className="text-sm" style={{ color: "var(--color-muted)" }}>No speeches were submitted.</p>
                              )}
                            </div>
                          </details>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <p className="text-xs mt-6" style={{ color: "var(--color-muted)" }}>
        Your saved reviews stay in this browser on this device. The 12 most recent are kept.
      </p>
    </div>
  );
}
