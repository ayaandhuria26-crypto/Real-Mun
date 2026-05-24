import type { ConferenceSetup, SessionPlan, Phase } from "./types";

export async function planSession(setup: ConferenceSetup): Promise<SessionPlan> {
  const total = setup.totalDurationMs;
  const delegates = setup.delegates;
  const c0 = delegates[0].country;
  const c1 = delegates[1].country;
  const c2 = delegates[2].country;

  // Procedural phase durations (fixed)
  const rollCallMs = 45_000;
  const motionOpenMs = 25_000;
  const gslSetupMs = 25_000;
  const motionMod1Ms = 25_000;
  const motionUnmodMs = 25_000;
  const motionMod2Ms = 25_000;
  const closingMs = 60_000;

  const fixedMs =
    rollCallMs +
    motionOpenMs +
    gslSetupMs +
    motionMod1Ms +
    motionUnmodMs +
    motionMod2Ms +
    closingMs;

  const flexMs = total - fixedMs;

  const openingSpeechesMs = Math.round(flexMs * 0.30);
  const modCaucus1Ms = Math.round(flexMs * 0.22);
  const unmodCaucusMs = Math.round(flexMs * 0.18);
  const modCaucus2Ms = flexMs - openingSpeechesMs - modCaucus1Ms - unmodCaucusMs;

  const phases: Phase[] = [
    {
      type: "roll_call",
      durationMs: rollCallMs,
      description: "Chair calls roll — delegates respond present or present and voting.",
    },
    {
      type: "motion_open_debate",
      durationMs: motionOpenMs,
      description: "AI delegate motions to open debate.",
    },
    {
      type: "gsl_setup",
      durationMs: gslSetupMs,
      description: "Speakers list established via raised placards.",
    },
    {
      type: "opening_speeches",
      durationMs: openingSpeechesMs,
      individualSpeakingTimeSec: 75,
      speakerOrder: ["user", c0, c1, c2],
      description: "Each delegation gives an opening statement.",
    },
    {
      type: "motion_mod_caucus",
      topicFocus: `Concrete mechanisms for ${setup.topic}`,
      durationMs: motionMod1Ms,
      description: "Motion for first moderated caucus.",
    },
    {
      type: "moderated_caucus",
      topicFocus: `Concrete mechanisms for ${setup.topic}`,
      durationMs: modCaucus1Ms,
      individualSpeakingTimeSec: 50,
      speakerOrder: ["user", c0, c1, c2, "user"],
      description: "Focused discussion on mechanisms.",
    },
    {
      type: "motion_unmod_caucus",
      durationMs: motionUnmodMs,
      description: "Motion for unmoderated caucus.",
    },
    {
      type: "unmoderated_caucus",
      topicFocus: "Bloc formation and working paper drafting",
      durationMs: unmodCaucusMs,
      description: "Informal bloc negotiations.",
    },
    {
      type: "motion_mod_caucus",
      topicFocus: "Bridging proposals and finalizing resolution language",
      durationMs: motionMod2Ms,
      description: "Motion for second moderated caucus.",
    },
    {
      type: "moderated_caucus",
      topicFocus: "Bridging proposals and finalizing resolution language",
      durationMs: modCaucus2Ms,
      individualSpeakingTimeSec: 50,
      speakerOrder: ["user", c2, c0, c1],
      description: "Final proposals and resolution language.",
    },
    {
      type: "closing",
      durationMs: closingMs,
      description: "Chair delivers closing remarks and adjourns the session.",
    },
  ];

  return { phases };
}
