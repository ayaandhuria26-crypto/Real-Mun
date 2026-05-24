interface Score {
  score: number;
  comment: string;
}

interface LineEdit {
  original: string;
  suggested: string;
  why: string;
}

export interface FeedbackData {
  overall_score: number;
  scores: {
    research_depth: Score;
    policy_alignment: Score;
    structure: Score;
    persuasiveness: Score;
    mun_language: Score;
  };
  strengths: string[];
  weaknesses: string[];
  line_edits: LineEdit[];
  policy_red_flags: string[];
  next_steps: string[];
}

function letterGrade(pct: number): string {
  if (pct >= 0.9) return "A+";
  if (pct >= 0.8) return "A";
  if (pct >= 0.7) return "B";
  if (pct >= 0.6) return "C";
  if (pct >= 0.5) return "D";
  return "F";
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.min(score / max, 1);
  return (
    <div className="w-full h-1.5 rounded-full mt-2"
      style={{ background: "var(--color-border-strong)" }}>
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct * 100}%`,
          background: pct >= 0.7 ? "var(--color-accent)" : pct >= 0.5 ? "#f59e0b" : "#ef4444",
        }}
      />
    </div>
  );
}

const DIMENSION_LABELS: Record<keyof FeedbackData["scores"], string> = {
  research_depth: "Research Depth",
  policy_alignment: "Policy Alignment",
  structure: "Structure",
  persuasiveness: "Persuasiveness",
  mun_language: "MUN Language",
};

export default function FeedbackView({
  feedback,
  committee,
  country,
  topic,
}: {
  feedback: FeedbackData;
  committee?: string;
  country?: string;
  topic?: string;
}) {
  const pct = feedback.overall_score / 50;
  const grade = letterGrade(pct);

  return (
    <div className="space-y-5">
      {/* Hero card */}
      <div
        className="rounded-2xl px-6 py-6"
        style={{ background: "var(--color-ink)" }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-5xl font-bold mb-1"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-paper)" }}>
              {feedback.overall_score}
              <span className="text-2xl" style={{ color: "rgba(245,243,237,0.5)" }}>/50</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>
              {grade}
            </div>
          </div>
          {topic && (
            <div className="text-right">
              {committee && <div className="text-xs" style={{ color: "rgba(245,243,237,0.5)" }}>{committee}</div>}
              {country && <div className="text-sm font-medium" style={{ color: "var(--color-paper)" }}>{country}</div>}
              <div className="text-xs mt-0.5" style={{ color: "rgba(245,243,237,0.6)" }}>{topic}</div>
            </div>
          )}
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${pct * 100}%`, background: "var(--color-accent)" }}
          />
        </div>
      </div>

      {/* Dimension scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(feedback.scores) as Array<keyof typeof feedback.scores>).map((key) => {
          const s = feedback.scores[key];
          return (
            <div key={key} className="card">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>
                  {DIMENSION_LABELS[key]}
                </span>
                <span className="text-sm font-bold" style={{ color: "var(--color-accent)" }}>
                  {s.score}/10
                </span>
              </div>
              <ScoreBar score={s.score} />
              <p className="text-xs mt-2" style={{ color: "var(--color-muted)" }}>
                {s.comment}
              </p>
            </div>
          );
        })}
      </div>

      {/* Policy red flags */}
      {feedback.policy_red_flags && feedback.policy_red_flags.length > 0 && (
        <div className="card" style={{ border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.05)" }}>
          <div className="font-semibold mb-3 text-sm" style={{ color: "#dc2626" }}>
            ⚠ Policy Red Flags
          </div>
          <ul className="space-y-1.5">
            {feedback.policy_red_flags.map((f, i) => (
              <li key={i} className="text-sm" style={{ color: "#dc2626" }}>• {f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="font-semibold mb-3 text-sm" style={{ color: "var(--color-accent)" }}>
            Strengths
          </div>
          <ul className="space-y-2">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span style={{ color: "var(--color-accent)" }}>✓</span>
                <span style={{ color: "var(--color-muted)" }}>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div className="font-semibold mb-3 text-sm" style={{ color: "#dc2626" }}>
            Weaknesses
          </div>
          <ul className="space-y-2">
            {feedback.weaknesses.map((w, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span style={{ color: "#dc2626" }}>✗</span>
                <span style={{ color: "var(--color-muted)" }}>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Line edits */}
      {feedback.line_edits && feedback.line_edits.length > 0 && (
        <div className="card">
          <div className="font-semibold mb-4 text-sm" style={{ color: "var(--color-ink)" }}>
            Suggested Line Edits
          </div>
          <div className="space-y-5">
            {feedback.line_edits.map((edit, i) => (
              <div key={i}>
                <div className="text-sm mb-1 line-through" style={{ color: "#ef4444" }}>
                  &ldquo;{edit.original}&rdquo;
                </div>
                <div className="text-sm mb-1" style={{ color: "#16a34a" }}>
                  → &ldquo;{edit.suggested}&rdquo;
                </div>
                <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {edit.why}
                </div>
                {i < feedback.line_edits.length - 1 && (
                  <hr className="mt-4" style={{ borderColor: "var(--color-border)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next steps */}
      {feedback.next_steps && feedback.next_steps.length > 0 && (
        <div className="card" style={{ background: "rgba(184,134,11,0.05)", border: "1px solid rgba(184,134,11,0.2)" }}>
          <div className="font-semibold mb-3 text-sm" style={{ color: "var(--color-accent)" }}>
            Do these before conference
          </div>
          <ol className="space-y-2">
            {feedback.next_steps.map((step, i) => (
              <li key={i} className="text-sm flex gap-3">
                <span className="font-bold flex-shrink-0" style={{ color: "var(--color-accent)" }}>
                  {i + 1}.
                </span>
                <span style={{ color: "var(--color-muted)" }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
