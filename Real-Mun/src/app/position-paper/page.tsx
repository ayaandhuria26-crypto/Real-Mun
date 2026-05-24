"use client";

import { useState } from "react";
import { COMMITTEES, POPULAR_COUNTRIES, SAMPLE_TOPICS } from "@/lib/mun-data";
import FeedbackView, { type FeedbackData } from "@/components/FeedbackView";

export default function PositionPaperPage() {
  const [step, setStep] = useState(1);
  const [committee, setCommittee] = useState("");
  const [country, setCountry] = useState("");
  const [topic, setTopic] = useState("");
  const [paper, setPaper] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);

  const wordCount = paper.trim() ? paper.trim().split(/\s+/).length : 0;

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/paper-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ committee, country, topic, paper }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Feedback failed");
      setFeedback(data.feedback as FeedbackData);
      setStep(5);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(1);
    setCommittee("");
    setCountry("");
    setTopic("");
    setPaper("");
    setFeedback(null);
    setError("");
  }

  const steps = [1, 2, 3, 4, 5];

  return (
    <div className="max-w-4xl mx-auto px-5 py-12" style={{ background: "var(--color-paper)" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="gold-rule mb-4" />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
            >
              Position Paper Feedback
            </h1>
            <p style={{ color: "var(--color-muted)" }}>
              AI-graded on 5 dimensions in under a minute.
            </p>
          </div>
          <div
            className="text-xs flex items-center gap-3 px-4 py-2 rounded-full border"
            style={{
              borderColor: "var(--color-border-strong)",
              color: "var(--color-muted)",
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              AD
            </div>
            <span>
              Rubric designed by <strong style={{ color: "var(--color-ink)" }}>Ayaan Dhuria</strong>,
              founder · 1 Best Delegate, 1 Honorable Mention across 3 conferences.
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {step < 5 && (
        <div className="flex gap-1 mb-8">
          {steps.slice(0, 4).map((s) => (
            <div
              key={s}
              className="flex-1 h-1.5 rounded-full transition-all"
              style={{
                background:
                  s <= step
                    ? "var(--color-accent)"
                    : "var(--color-border-strong)",
              }}
            />
          ))}
        </div>
      )}

      {/* Step 1: Committee */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--color-ink)" }}>
            Select a committee
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMMITTEES.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCommittee(c.name);
                  setStep(2);
                }}
                className="card text-left transition-all"
                style={{
                  border: committee === c.name ? "2px solid var(--color-accent)" : undefined,
                  cursor: "pointer",
                }}
              >
                <div className="font-medium" style={{ color: "var(--color-ink)" }}>
                  {c.name}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                  {c.size}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Country */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-ink)" }}>
            Which country are you representing?
          </h2>
          <p className="mb-4 text-sm" style={{ color: "var(--color-muted)" }}>
            Committee: <strong>{committee}</strong>
          </p>
          <input
            type="text"
            placeholder="Type or select a country..."
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border mb-4 text-base"
            style={{
              borderColor: "var(--color-border-strong)",
              background: "var(--color-card)",
              color: "var(--color-ink)",
            }}
          />
          <div className="flex flex-wrap gap-2 mb-6">
            {POPULAR_COUNTRIES.slice(0, 20).map((c) => (
              <button
                key={c}
                onClick={() => setCountry(c)}
                className="px-3 py-1.5 rounded-full text-sm border transition"
                style={{
                  background: country === c ? "var(--color-ink)" : "var(--color-card)",
                  color: country === c ? "var(--color-paper)" : "var(--color-ink)",
                  borderColor: "var(--color-border-strong)",
                  cursor: "pointer",
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn btn-secondary">
              Back
            </button>
            <button
              onClick={() => country && setStep(3)}
              disabled={!country}
              className="btn btn-primary"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Topic */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-ink)" }}>
            What's the topic?
          </h2>
          <p className="mb-4 text-sm" style={{ color: "var(--color-muted)" }}>
            {committee} · {country}
          </p>
          <input
            type="text"
            placeholder="Enter the agenda topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border mb-4 text-base"
            style={{
              borderColor: "var(--color-border-strong)",
              background: "var(--color-card)",
              color: "var(--color-ink)",
            }}
          />
          <div className="flex flex-wrap gap-2 mb-6">
            {SAMPLE_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className="px-3 py-1.5 rounded-full text-sm border transition"
                style={{
                  background: topic === t ? "var(--color-ink)" : "var(--color-card)",
                  color: topic === t ? "var(--color-paper)" : "var(--color-ink)",
                  borderColor: "var(--color-border-strong)",
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn btn-secondary">
              Back
            </button>
            <button
              onClick={() => topic && setStep(4)}
              disabled={!topic}
              className="btn btn-primary"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Paper */}
      {step === 4 && (
        <div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-ink)" }}>
            Paste your position paper
          </h2>
          <p className="mb-4 text-sm" style={{ color: "var(--color-muted)" }}>
            {committee} · {country} · {topic}
          </p>
          <textarea
            value={paper}
            onChange={(e) => setPaper(e.target.value)}
            placeholder="Paste your position paper here (minimum 50 words)..."
            rows={14}
            maxLength={20000}
            className="w-full px-4 py-3 rounded-lg border text-base mb-2 resize-y"
            style={{
              borderColor: "var(--color-border-strong)",
              background: "var(--color-card)",
              color: "var(--color-ink)",
              fontFamily: "ui-monospace, monospace",
              fontSize: "0.875rem",
            }}
          />
          <div className="flex justify-between text-xs mb-6" style={{ color: "var(--color-muted)" }}>
            <span>{wordCount} words</span>
            <span>{paper.length} / 20,000 chars</span>
          </div>
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}
            >
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="btn btn-secondary" disabled={loading}>
              Back
            </button>
            <button
              onClick={submit}
              disabled={loading || paper.trim().split(/\s+/).length < 50}
              className="btn btn-primary"
            >
              {loading ? "Grading…" : "Get feedback →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Feedback */}
      {step === 5 && feedback && (
        <div>
          <FeedbackView
            feedback={feedback}
            committee={committee}
            country={country}
            topic={topic}
          />
          <button onClick={reset} className="btn btn-secondary mt-8">
            Review another paper
          </button>
        </div>
      )}
    </div>
  );
}
