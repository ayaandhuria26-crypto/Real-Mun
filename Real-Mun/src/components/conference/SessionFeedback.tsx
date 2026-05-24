interface SubScore {
  score: number;
  comment: string;
}

export interface SessionFeedbackData {
  overall_score: number;
  highlights: string[];
  issues: string[];
  delivery: SubScore;
  content: SubScore;
  engagement: SubScore;
  rewrite_example: {
    original: string;
    improved: string;
    why: string;
  };
  next_session_focus: string[];
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

export default function SessionFeedback({
  feedback,
}: {
  feedback: SessionFeedbackData;
}) {
  if (!feedback || (feedback as unknown as { error?: string }).error) {
    return (
      <div className="card">
        <p style={{ color: "var(--color-muted)" }}>
          Feedback unavailable. {(feedback as unknown as { error?: string }).error ?? ""}
        </p>
      </div>
    );
  }

  const pct = feedback.overall_score / 100;
  const grade = letterGrade(pct);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="rounded-2xl px-6 py-6" style={{ background: "var(--color-ink)" }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-5xl font-bold mb-1"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-paper)" }}>
              {feedback.overall_score}
              <span className="text-2xl" style={{ color: "rgba(245,243,237,0.5)" }}>/100</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>
              {grade}
            </div>
          </div>
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: "var(--color-accent)" }} />
        </div>
      </div>

      {/* Sub-scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: "delivery", label: "Delivery" },
          { key: "content", label: "Content" },
          { key: "engagement", label: "Engagement" },
        ].map(({ key, label }) => {
          const s = feedback[key as keyof Pick<SessionFeedbackData, "delivery" | "content" | "engagement">];
          return (
            <div key={key} className="card">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>
                  {label}
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

      {/* Highlights & Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="font-semibold mb-3 text-sm" style={{ color: "var(--color-accent)" }}>
            Highlights
          </div>
          <ul className="space-y-2">
            {(feedback.highlights ?? []).map((h, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span style={{ color: "var(--color-accent)" }}>✓</span>
                <span style={{ color: "var(--color-muted)" }}>{h}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div className="font-semibold mb-3 text-sm" style={{ color: "#dc2626" }}>
            Issues
          </div>
          <ul className="space-y-2">
            {(feedback.issues ?? []).map((issue, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span style={{ color: "#dc2626" }}>✗</span>
                <span style={{ color: "var(--color-muted)" }}>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Rewrite example */}
      {feedback.rewrite_example && (
        <div className="card">
          <div className="font-semibold mb-4 text-sm" style={{ color: "var(--color-ink)" }}>
            Rewrite Example
          </div>
          <div className="text-sm mb-1 line-through" style={{ color: "#ef4444" }}>
            &ldquo;{feedback.rewrite_example.original}&rdquo;
          </div>
          <div className="text-sm mb-2" style={{ color: "#16a34a" }}>
            → &ldquo;{feedback.rewrite_example.improved}&rdquo;
          </div>
          <div className="text-xs" style={{ color: "var(--color-muted)" }}>
            {feedback.rewrite_example.why}
          </div>
        </div>
      )}

      {/* Next session focus */}
      {feedback.next_session_focus && feedback.next_session_focus.length > 0 && (
        <div className="card"
          style={{ background: "rgba(184,134,11,0.05)", border: "1px solid rgba(184,134,11,0.2)" }}>
          <div className="font-semibold mb-3 text-sm" style={{ color: "var(--color-accent)" }}>
            Focus for your next session
          </div>
          <ol className="space-y-2">
            {feedback.next_session_focus.map((item, i) => (
              <li key={i} className="text-sm flex gap-3">
                <span className="font-bold flex-shrink-0" style={{ color: "var(--color-accent)" }}>
                  {i + 1}.
                </span>
                <span style={{ color: "var(--color-muted)" }}>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
