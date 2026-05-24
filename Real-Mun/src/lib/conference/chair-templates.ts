import type { ConferenceSetup, DelegateConfig, Phase, PhaseType } from "./types";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function rollCallOpening(setup: ConferenceSetup): string {
  const allCountries = [
    ...setup.delegates.map((d) => d.country),
    setup.userCountry,
  ];
  return `Delegates, the committee will come to order. We will now proceed with the roll call. When called, please respond "present" or "present and voting." Roll: ${allCountries.join(", ")}.`;
}

export function motionOpenDebateOpening(setup: ConferenceSetup): string {
  return `The roll being established, the chair entertains a motion to open debate on the topic of "${setup.topic}."`;
}

export function gslSetupOpening(): string {
  return "Debate is now open. The chair will now establish the General Speakers' List. All delegations wishing to be added to the speakers' list, please raise your placards now.";
}

export function gslAnnouncement(
  order: string[],
  userCountry: string,
  speakingTimeSec: number
): string {
  const named = order.map((s) => (s === "user" ? userCountry : s));
  return `Thank you. The speakers' list is set as follows: ${named.join(", then ")}. Each delegation will have ${speakingTimeSec} seconds. The chair recognizes the first speaker.`;
}

export function openingSpeechesOpening(
  setup: ConferenceSetup,
  phase: Phase
): string {
  const firstSpeaker = phase.speakerOrder?.[0] ?? "user";
  const country = firstSpeaker === "user" ? setup.userCountry : firstSpeaker;
  const firstLabel = `the delegation of ${country}`;
  return `The chair recognizes ${firstLabel}.`;
}

export function motionModCaucusOpening(setup: ConferenceSetup, phase: Phase): string {
  return `The chair entertains a motion for a moderated caucus on "${phase.topicFocus || setup.topic}."`;
}

export function moderatedCaucusOpening(setup: ConferenceSetup, phase: Phase): string {
  const totalSec = Math.round(phase.durationMs / 1000);
  const totalMin = Math.floor(totalSec / 60);
  const remSec = totalSec % 60;
  const total = remSec > 0 ? `${totalMin} minutes, ${remSec} seconds` : `${totalMin} minutes`;
  const t = phase.individualSpeakingTimeSec ?? 50;
  const firstSpeaker = phase.speakerOrder?.[0] ?? "user";
  const country = firstSpeaker === "user" ? setup.userCountry : firstSpeaker;
  const firstLabel = `the delegation of ${country}`;
  return `Moderated caucus on "${phase.topicFocus}" for ${total}, ${t} seconds per speaker. The chair recognizes ${firstLabel}.`;
}

export function motionUnmodCaucusOpening(): string {
  return "The chair entertains a motion for an unmoderated caucus to begin bloc work.";
}

export function unmoderatedCaucusOpening(phase: Phase): string {
  const totalSec = Math.round(phase.durationMs / 1000);
  const totalMin = Math.floor(totalSec / 60);
  const remSec = totalSec % 60;
  const total = remSec > 0 ? `${totalMin} minutes, ${remSec} seconds` : `${totalMin} minutes`;
  return `A ${total} unmoderated caucus is in order. Delegates may leave their seats. Form blocs, exchange working papers.`;
}

export function votingOpening(): string {
  return "The committee will now move into voting procedure. The floor is closed to debate.";
}

export function recognizeNext(speaker: string, country?: string): string {
  if (speaker === "user" && country) {
    return pick([
      `The delegation of ${country}.`,
      `${country}, you have the floor.`,
      `The chair recognizes the delegation of ${country}.`,
    ]);
  }
  return pick([
    `The delegation of ${speaker}.`,
    `${speaker}.`,
    `The chair recognizes ${speaker}.`,
  ]);
}

export function recognizeUserPlacard(country: string): string {
  return pick([
    `The chair sees the placard of ${country}. You have the floor — sixty seconds.`,
    `${country}, you are recognized.`,
    `The delegation of ${country} is recognized.`,
  ]);
}

export function delegateMotion(
  delegate: DelegateConfig,
  motion: "open_debate" | "gsl" | "mod_caucus" | "unmod_caucus",
  topicFocus?: string
): string {
  if (motion === "open_debate") {
    return pick([
      `Motion to open debate on the topic at hand.`,
      `The delegation of ${delegate.country} motions to open debate.`,
      `Motion to open debate, honorable chair.`,
    ]);
  }
  if (motion === "gsl") {
    return pick([
      `Motion to open the General Speakers' List.`,
      `Honorable chair, motion to set the speakers' list.`,
    ]);
  }
  if (motion === "mod_caucus") {
    return pick([
      `Motion for a moderated caucus on ${topicFocus ?? "this matter"}, six minutes total, sixty seconds per speaker.`,
      `Motion for a six-minute moderated caucus, sixty seconds individual, on ${topicFocus ?? "the matter at hand"}.`,
    ]);
  }
  // unmod_caucus
  return pick([
    `Motion for a six-minute unmoderated caucus to begin bloc work.`,
    `Motion for an unmoderated caucus, six minutes, for working paper drafting.`,
  ]);
}

export function chairAcceptsMotion(): string {
  return pick([
    `Are there any objections? Seeing none, the motion passes.`,
    `The chair entertains the motion. No objections — the motion passes by acclamation.`,
    `The chair sees no objections. The motion passes.`,
  ]);
}

export function placardResponse(country: string): string {
  return pick([
    `The delegation of ${country} raises its placard.`,
    `${country} raises.`,
    `${country} stands ready.`,
  ]);
}

export function acknowledgeMotion(
  country: string,
  motion: string,
  details: string | undefined,
  _setup: ConferenceSetup
): string | null {
  const m = motion.toLowerCase();
  const d = details ? `, ${details}` : "";

  if (m.includes("moderated caucus")) {
    return `The delegation of ${country} is recognized. Motion for a moderated caucus${d}. Any objections? Seeing none, the motion passes.`;
  }
  if (m.includes("unmoderated caucus")) {
    return `The delegation of ${country} is recognized. Motion for an unmoderated caucus${d}. The motion passes by acclamation.`;
  }
  if (m.includes("extend")) {
    return `The chair recognizes the motion to extend${details ? `: ${details}` : ""}. Any objections? The motion passes.`;
  }
  if (m.includes("point of inquiry")) {
    return `The chair recognizes the inquiry${details ? `: ${details}` : ""}. The chair refers the delegate to the rules of procedure.`;
  }
  if (m.includes("point of order")) {
    return `Point of order noted${details ? `: ${details}` : ""}. The chair will rule. Please continue.`;
  }
  if (m.includes("close debate")) {
    return `A motion to close debate has been made. The chair will move to voting procedure.`;
  }
  if (m.includes("introduce") && m.includes("resolution")) {
    return `The chair recognizes the delegation of ${country}. The draft resolution is in order for circulation.`;
  }

  return null;
}

export function closingTransition(nextPhaseType?: PhaseType): string {
  if (nextPhaseType === "closing") {
    return pick([
      `Time. We will now move to closing remarks.`,
      `The committee will now proceed to closing.`,
    ]);
  }
  if (nextPhaseType === "voting") {
    return pick([
      `Time. We will now move to voting procedure.`,
      `The committee will proceed to a vote.`,
    ]);
  }
  return pick([
    `Time. The committee will proceed.`,
    `Time has expired on this caucus.`,
    `The chair will move forward.`,
  ]);
}

export function phaseOpenTemplate(
  setup: ConferenceSetup,
  phase: Phase
): string | null {
  switch (phase.type) {
    case "roll_call":
      return rollCallOpening(setup);
    case "motion_open_debate":
      return motionOpenDebateOpening(setup);
    case "gsl_setup":
      return gslSetupOpening();
    case "opening_speeches":
      return openingSpeechesOpening(setup, phase);
    case "motion_mod_caucus":
      return motionModCaucusOpening(setup, phase);
    case "moderated_caucus":
      return moderatedCaucusOpening(setup, phase);
    case "motion_unmod_caucus":
      return motionUnmodCaucusOpening();
    case "unmoderated_caucus":
      return unmoderatedCaucusOpening(phase);
    case "voting":
      return votingOpening();
    case "closing":
      return null; // LLM-generated
    default:
      return null;
  }
}
