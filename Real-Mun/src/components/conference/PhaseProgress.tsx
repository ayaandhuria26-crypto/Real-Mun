"use client";

import type { Phase, PhaseType } from "@/lib/conference/types";

const PHASE_LABEL: Record<PhaseType, string> = {
  roll_call: "Roll Call",
  motion_open_debate: "Open Debate Motion",
  gsl_setup: "Speakers' List",
  opening_speeches: "Opening Speeches",
  motion_mod_caucus: "Mod Caucus Motion",
  moderated_caucus: "Moderated Caucus",
  motion_unmod_caucus: "Unmod Caucus Motion",
  unmoderated_caucus: "Unmoderated Caucus",
  voting: "Voting",
  closing: "Closing",
};

const PROC_TYPES: PhaseType[] = [
  "roll_call", "motion_open_debate", "gsl_setup",
  "motion_mod_caucus", "motion_unmod_caucus",
];

export default function PhaseProgress({
  phases,
  currentIndex,
}: {
  phases: Phase[];
  currentIndex: number;
}) {
  // Count only substantive phases for the progress numbers
  const substantive = phases.filter((p) => !PROC_TYPES.includes(p.type));
  const substantiveDone = phases.slice(0, currentIndex).filter((p) => !PROC_TYPES.includes(p.type)).length;

  return (
    <div className="flex items-center gap-1 flex-wrap py-2">
      {phases.map((phase, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const isProc = PROC_TYPES.includes(phase.type);

        if (active) {
          return (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{ background: "rgba(184,134,11,0.15)" }}
            >
              <span className="phase-dot active" />
              <span className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>
                {PHASE_LABEL[phase.type]}
                {phase.topicFocus && (
                  <span style={{ color: "rgba(184,134,11,0.7)", fontWeight: 400 }}>
                    {" "}· {phase.topicFocus.length > 30 ? phase.topicFocus.slice(0, 30) + "…" : phase.topicFocus}
                  </span>
                )}
              </span>
            </div>
          );
        }

        return (
          <span
            key={i}
            className={`phase-dot ${done ? "done" : ""} ${isProc ? "opacity-50" : ""}`}
            title={PHASE_LABEL[phase.type] + (phase.topicFocus ? ` — ${phase.topicFocus}` : "")}
          />
        );
      })}
      <span className="text-xs ml-1" style={{ color: "var(--color-muted)" }}>
        {substantiveDone}/{substantive.length}
      </span>
    </div>
  );
}
