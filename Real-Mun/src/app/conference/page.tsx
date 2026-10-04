"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COMMITTEES, SAMPLE_TOPICS } from "@/lib/mun-data";
import type { DelegateConfig, Persona } from "@/lib/conference/types";

const PERSONAS: { value: Persona; label: string; blurb: string }[] = [
  { value: "diplomatic", label: "Diplomatic", blurb: "Measured, formal, builds bridges." },
  { value: "aggressive", label: "Aggressive", blurb: "Direct, willing to challenge other delegations." },
  { value: "coalition_builder", label: "Coalition Builder", blurb: "Constantly proposes collaboration." },
  { value: "technical", label: "Technical", blurb: "Heavy on specifics, data, and treaty articles." },
  { value: "quiet", label: "Quiet", blurb: "Speaks rarely but with weight." },
];

const COUNTRY_CHIPS = [
  "United States", "China", "Russia", "United Kingdom", "France",
  "Germany", "India", "Brazil", "South Africa", "Japan",
  "Egypt", "Turkey",
];

const defaultDelegates: [DelegateConfig, DelegateConfig, DelegateConfig] = [
  {
    id: "d1",
    country: "United States",
    persona: "aggressive",
    shortDescription: "Veteran delegate, pushes hard for liberal-order solutions.",
  },
  {
    id: "d2",
    country: "China",
    persona: "diplomatic",
    shortDescription: "Calm, principled, frames everything through sovereignty.",
  },
  {
    id: "d3",
    country: "Brazil",
    persona: "coalition_builder",
    shortDescription: "Tries to bridge Global North and Global South positions.",
  },
];

export default function ConferenceSetupPage() {
  const router = useRouter();
  const [committee, setCommittee] = useState(COMMITTEES[0].name);
  const [topic, setTopic] = useState(SAMPLE_TOPICS[0]);
  const [userCountry, setUserCountry] = useState("France");
  const [delegates, setDelegates] = useState<[DelegateConfig, DelegateConfig, DelegateConfig]>(
    defaultDelegates
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateDelegate(
    id: "d1" | "d2" | "d3",
    updates: Partial<DelegateConfig>
  ) {
    setDelegates((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d)) as [
        DelegateConfig,
        DelegateConfig,
        DelegateConfig
      ]
    );
  }

  async function begin() {
    if (committee.trim().length < 2 || topic.trim().length < 2) {
      setError("Enter a committee and topic with at least two characters each.");
      return;
    }
    const countries = [userCountry, ...delegates.map((delegate) => delegate.country)];
    if (countries.some((country) => country.trim().length < 2)) {
      setError("Enter a country of at least two characters for every delegation.");
      return;
    }
    if (new Set(countries.map((country) => country.trim().toLowerCase())).size !== countries.length) {
      setError("Each delegation must represent a different country.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/conference/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          committee,
          topic,
          userCountry: userCountry.trim(),
          delegates: delegates.map((delegate) => ({
            ...delegate,
            country: delegate.country.trim(),
          })),
          totalDurationMs: 30 * 60_000,
        }),
      });
      const data: { error?: string; state?: unknown } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to start session");
      if (!data.state) throw new Error("The conference planner returned an incomplete session. Please try again.");
      sessionStorage.setItem("conferenceState", JSON.stringify(data.state));
      router.push("/conference/live");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-12" style={{ background: "var(--color-paper)" }}>
      <div className="gold-rule mb-6" />
      <h1 className="text-4xl font-bold mb-2"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
        Mock Conference
      </h1>
      <p className="mb-10" style={{ color: "var(--color-muted)" }}>
        Configure your 30-minute committee session. You&apos;ll go first in opening speeches.
      </p>

      {/* Committee */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--color-ink)" }}>
          Committee
        </h2>
        <select
          value={committee}
          onChange={(e) => setCommittee(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border text-sm"
          style={{
            borderColor: "var(--color-border-strong)",
            background: "var(--color-card)",
            color: "var(--color-ink)",
          }}
        >
          {COMMITTEES.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </section>

      {/* Topic */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--color-ink)" }}>
          Topic
        </h2>
        <input
          type="text"
          minLength={2}
          maxLength={300}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border text-sm mb-3"
          style={{
            borderColor: "var(--color-border-strong)",
            background: "var(--color-card)",
            color: "var(--color-ink)",
          }}
          placeholder="Type an agenda topic..."
        />
        <div className="flex flex-wrap gap-2">
          {SAMPLE_TOPICS.slice(0, 5).map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className="px-3 py-1.5 rounded-full text-xs border transition"
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
      </section>

      {/* Your country */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--color-ink)" }}>
          Your delegation
        </h2>
        <input
          type="text"
          minLength={2}
          maxLength={100}
          value={userCountry}
          onChange={(e) => setUserCountry(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border text-sm mb-3"
          style={{
            borderColor: "var(--color-border-strong)",
            background: "var(--color-card)",
            color: "var(--color-ink)",
          }}
          placeholder="Country name..."
        />
        <div className="flex flex-wrap gap-2">
          {COUNTRY_CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => setUserCountry(c)}
              className="px-3 py-1.5 rounded-full text-xs border transition"
              style={{
                background: userCountry === c ? "var(--color-ink)" : "var(--color-card)",
                color: userCountry === c ? "var(--color-paper)" : "var(--color-ink)",
                borderColor: "var(--color-border-strong)",
                cursor: "pointer",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* AI Delegates */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--color-ink)" }}>
          AI Delegates
        </h2>
        <div className="space-y-5">
          {delegates.map((d) => (
            <div key={d.id} className="card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-mono uppercase tracking-widest"
                  style={{ color: "var(--color-muted)" }}>
                  {d.id.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1"
                    style={{ color: "var(--color-muted)" }}>
                    Country
                  </label>
                  <input
                    type="text"
                    minLength={2}
                    maxLength={100}
                    value={d.country}
                    onChange={(e) => updateDelegate(d.id, { country: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border text-sm"
                    style={{
                      borderColor: "var(--color-border-strong)",
                      background: "var(--color-card)",
                      color: "var(--color-ink)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1"
                    style={{ color: "var(--color-muted)" }}>
                    Persona
                  </label>
                  <select
                    value={d.persona}
                    onChange={(e) => updateDelegate(d.id, { persona: e.target.value as Persona })}
                    className="w-full px-3 py-2 rounded-md border text-sm"
                    style={{
                      borderColor: "var(--color-border-strong)",
                      background: "var(--color-card)",
                      color: "var(--color-ink)",
                    }}
                  >
                    {PERSONAS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label} — {p.blurb}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1"
                    style={{ color: "var(--color-muted)" }}>
                    Description
                  </label>
                  <textarea
                    maxLength={500}
                    value={d.shortDescription}
                    onChange={(e) => updateDelegate(d.id, { shortDescription: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-md border text-sm resize-none"
                    style={{
                      borderColor: "var(--color-border-strong)",
                      background: "var(--color-card)",
                      color: "var(--color-ink)",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Free pill */}
      <div className="flex items-center gap-3 mb-8 p-4 rounded-xl"
        style={{ background: "rgba(184,134,11,0.08)", border: "1px solid rgba(184,134,11,0.2)" }}>
        <div className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: "var(--color-accent)", color: "#fff" }}>
          FREE
        </div>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          Powered by Google Gemini Flash with auto-fallback to Groq and Cerebras. No cost, no sign-up required.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm"
          style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>
          {error}
        </div>
      )}

      <button
        onClick={begin}
        disabled={loading || committee.trim().length < 2 || topic.trim().length < 2 || userCountry.trim().length < 2}
        className="btn btn-primary text-base px-8 py-3"
        style={{ fontSize: "1rem" }}
      >
        {loading ? "Convening the committee…" : "Begin session →"}
      </button>
    </div>
  );
}
