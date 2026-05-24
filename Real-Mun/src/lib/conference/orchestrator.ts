import type {
  ConferenceState,
  TranscriptEntry,
  TurnResult,
  Phase,
  PhaseType,
} from "./types";
import { chairSpeak, delegateSpeak } from "./agents";
import {
  rollCallOpening,
  gslAnnouncement,
  recognizeNext,
  recognizeUserPlacard,
  delegateMotion,
  chairAcceptsMotion,
  placardResponse,
  acknowledgeMotion,
  closingTransition,
  phaseOpenTemplate,
} from "./chair-templates";
import {
  normalizeWhitespace,
  trimToWordCap,
  maxWordsForPhase,
  maxTurnsForPhase,
} from "./overseer";

function newId(): string {
  return Math.random().toString(36).slice(2, 12);
}

function entry(
  role: TranscriptEntry["role"],
  speaker: string,
  text: string
): TranscriptEntry {
  return { id: newId(), role, speaker, text, timestamp: Date.now() };
}

function isProc(t: PhaseType): boolean {
  return (
    t === "motion_open_debate" ||
    t === "motion_mod_caucus" ||
    t === "motion_unmod_caucus" ||
    t === "gsl_setup" ||
    t === "roll_call"
  );
}

const CLOSING_FALLBACK = (topic: string): string =>
  `Delegates, we have reached the close of our session on ${topic}. The chair commends every delegation for their substantive engagement and the proposals advanced today. Significant progress has been made, and the chair looks forward to seeing these ideas developed further. The chair thanks you all for your participation, your professionalism, and your commitment to this body. This committee stands adjourned.`;

async function speakAndTrim(
  delegateIndex: number,
  state: ConferenceState,
  phase: Phase,
  opts: { isUnmoderated?: boolean } = {}
): Promise<string> {
  const delegate = state.setup.delegates[delegateIndex];
  try {
    const raw = await delegateSpeak({
      setup: state.setup,
      delegate,
      phase,
      transcript: state.transcript,
      isUnmoderated: opts.isUnmoderated,
    });
    const cleaned = normalizeWhitespace(raw, delegate.country);
    const trimmed = trimToWordCap(cleaned, maxWordsForPhase(phase));
    if (!trimmed || trimmed.length < 8) {
      return `Honorable Chair, the delegation of ${delegate.country} yields the remainder of its time.`;
    }
    return trimmed;
  } catch {
    return `Honorable Chair, the delegation of ${delegate.country} yields the remainder of its time.`;
  }
}

async function openPhase(state: ConferenceState): Promise<{
  newEntries: TranscriptEntry[];
  advance: Partial<ConferenceState>;
}> {
  const phase = state.plan.phases[state.phaseIndex];
  const setup = state.setup;
  const newEntries: TranscriptEntry[] = [];
  let userHasFloor = false;

  // Motion phases: bundle chair invite + delegate motion + chair accepts
  if (
    phase.type === "motion_open_debate" ||
    phase.type === "motion_mod_caucus" ||
    phase.type === "motion_unmod_caucus"
  ) {
    const opener = phaseOpenTemplate(setup, phase)!;
    newEntries.push(entry("chair", "Chair", opener));

    const mover = setup.delegates[0];
    let motionType: "open_debate" | "gsl" | "mod_caucus" | "unmod_caucus";
    if (phase.type === "motion_open_debate") motionType = "open_debate";
    else if (phase.type === "motion_unmod_caucus") motionType = "unmod_caucus";
    else motionType = "mod_caucus";

    const motionText = delegateMotion(mover, motionType, phase.topicFocus);
    newEntries.push(entry("delegate", mover.country, motionText));
    newEntries.push(entry("chair", "Chair", chairAcceptsMotion()));

    return {
      newEntries,
      advance: {
        lastOpenedPhaseIndex: state.phaseIndex,
        turnsThisPhase: newEntries.length,
      },
    };
  }

  // GSL setup: bundle placard responses + GSL announcement
  if (phase.type === "gsl_setup") {
    const opener = phaseOpenTemplate(setup, phase)!;
    newEntries.push(entry("chair", "Chair", opener));

    for (const d of setup.delegates) {
      newEntries.push(entry("delegate", d.country, placardResponse(d.country)));
    }

    const order = ["user", ...setup.delegates.map((d) => d.country)];
    newEntries.push(
      entry("chair", "Chair", gslAnnouncement(order, setup.userCountry, 75))
    );

    return {
      newEntries,
      advance: {
        lastOpenedPhaseIndex: state.phaseIndex,
        turnsThisPhase: newEntries.length,
      },
    };
  }

  // Closing — LLM generated
  if (phase.type === "closing") {
    let closingText: string;
    try {
      // Build a quick summary of who spoke and what policy angles surfaced
      const userSpeeches = state.transcript.filter((e) => e.role === "user").length;
      const delegateCountries = setup.delegates.map((d) => d.country).join(", ");
      closingText = await chairSpeak({
        setup,
        phase,
        transcript: state.transcript,
        instruction: `Deliver the closing remarks for the committee. The session covered "${setup.topic}" with delegations from ${delegateCountries} and ${setup.userCountry}. The user gave ${userSpeeches} speech${userSpeeches !== 1 ? "es" : ""}. Reference two or three specific policy ideas or moments that emerged in the transcript — name the country or speaker who raised them. Do not fabricate moments not in the transcript. Thank all delegations by name. End with exactly: "This committee stands adjourned." Keep total remarks between 100 and 150 words.`,
      });
      const words = closingText.trim().split(/\s+/).length;
      const endsClean = /[.!?]$/.test(closingText.trim());
      if (!endsClean || words < 30) {
        closingText = CLOSING_FALLBACK(setup.topic);
      }
    } catch {
      closingText = CLOSING_FALLBACK(setup.topic);
    }
    newEntries.push(entry("chair", "Chair", closingText));
    return {
      newEntries,
      advance: {
        lastOpenedPhaseIndex: state.phaseIndex,
        turnsThisPhase: newEntries.length,
      },
    };
  }

  // Roll call
  if (phase.type === "roll_call") {
    const opener = rollCallOpening(setup);
    newEntries.push(entry("chair", "Chair", opener));
    return {
      newEntries,
      advance: {
        lastOpenedPhaseIndex: state.phaseIndex,
        turnsThisPhase: newEntries.length,
      },
    };
  }

  // Opening speeches / moderated caucus — bundle opener + first speaker
  if (
    phase.type === "opening_speeches" ||
    phase.type === "moderated_caucus"
  ) {
    const opener = phaseOpenTemplate(setup, phase)!;
    newEntries.push(entry("chair", "Chair", opener));

    const firstSpeaker = phase.speakerOrder?.[0];
    if (!firstSpeaker || firstSpeaker === "user") {
      // User goes first — hand off floor
      userHasFloor = true;
      const chairLine = recognizeNext("user", setup.userCountry);
      newEntries.push(entry("chair", "Chair", chairLine));
    } else {
      // Delegate speaks first
      const delegateIndex = setup.delegates.findIndex(
        (d) => d.country === firstSpeaker
      );
      if (delegateIndex >= 0) {
        const chairLine = recognizeNext(firstSpeaker);
        newEntries.push(entry("chair", "Chair", chairLine));
        const speech = await speakAndTrim(delegateIndex, state, phase);
        newEntries.push(
          entry("delegate", setup.delegates[delegateIndex].country, speech)
        );
      }
    }

    return {
      newEntries,
      advance: {
        lastOpenedPhaseIndex: state.phaseIndex,
        speakerQueueIndex: 1,
        turnsThisPhase: newEntries.length,
        userHasFloor,
      },
    };
  }

  // Unmoderated caucus opener
  if (phase.type === "unmoderated_caucus") {
    const opener = phaseOpenTemplate(setup, phase)!;
    newEntries.push(entry("chair", "Chair", opener));
    return {
      newEntries,
      advance: {
        lastOpenedPhaseIndex: state.phaseIndex,
        turnsThisPhase: newEntries.length,
      },
    };
  }

  // Fallback
  return {
    newEntries,
    advance: { lastOpenedPhaseIndex: state.phaseIndex },
  };
}

const PHASE_LABEL: Record<string, string> = {
  roll_call: "Roll Call",
  motion_open_debate: "Opening Debate Motion",
  gsl_setup: "General Speakers' List",
  opening_speeches: "Opening Speeches",
  motion_mod_caucus: "Moderated Caucus Motion",
  moderated_caucus: "Moderated Caucus",
  motion_unmod_caucus: "Unmoderated Caucus Motion",
  unmoderated_caucus: "Unmoderated Caucus",
  voting: "Voting",
  closing: "Closing Remarks",
};

function transitionPhase(state: ConferenceState): {
  newEntries: TranscriptEntry[];
  advance: Partial<ConferenceState>;
} {
  const nextIndex = state.phaseIndex + 1;
  const nextPhase = state.plan.phases[nextIndex];
  const currentPhase = state.plan.phases[state.phaseIndex];
  const newEntries: TranscriptEntry[] = [];

  // Skip closing transition line when both phases are procedural
  const currentIsProc = isProc(currentPhase.type);
  const nextIsProc = nextPhase ? isProc(nextPhase.type) : false;

  if (!currentIsProc || !nextIsProc) {
    const transLine = closingTransition(nextPhase?.type);
    newEntries.push(entry("chair", "Chair", transLine));
  }

  // System marker for next phase
  if (nextPhase) {
    const label = PHASE_LABEL[nextPhase.type] ?? nextPhase.type.replace(/_/g, " ");
    const topic = nextPhase.topicFocus ? ` — ${nextPhase.topicFocus}` : "";
    newEntries.push(entry("system", "system", `${label}${topic}`));
  }

  return {
    newEntries,
    advance: {
      phaseIndex: nextIndex,
      lastOpenedPhaseIndex: state.lastOpenedPhaseIndex,
      speakerQueueIndex: 0,
      turnsThisPhase: 0,
      phaseStartedAt: Date.now(),
    },
  };
}

async function dispatchSpeaker(state: ConferenceState): Promise<{
  newEntries: TranscriptEntry[];
  advance: Partial<ConferenceState>;
}> {
  const phase = state.plan.phases[state.phaseIndex];
  const setup = state.setup;
  const newEntries: TranscriptEntry[] = [];
  let userHasFloor = false;

  // Roll call dispatch
  if (phase.type === "roll_call") {
    const roster = [
      ...setup.delegates.map((d) => d.country),
      setup.userCountry,
    ];

    // Roll call complete — transition to next phase
    if (state.speakerQueueIndex >= roster.length) {
      return transitionPhase(state);
    }

    const idx = state.speakerQueueIndex;
    const country = roster[idx];

    if (country === setup.userCountry) {
      const chairLine = `${setup.userCountry}?`;
      newEntries.push(entry("chair", "Chair", chairLine));
      userHasFloor = true;
    } else {
      const chairLine = `${country}?`;
      newEntries.push(entry("chair", "Chair", chairLine));
      const response =
        Math.random() < 0.4 ? "Present." : "Present and voting.";
      newEntries.push(entry("delegate", country, response));
    }

    return {
      newEntries,
      advance: {
        speakerQueueIndex: state.speakerQueueIndex + 1,
        turnsThisPhase: state.turnsThisPhase + newEntries.length,
        userHasFloor,
      },
    };
  }

  // Unmoderated caucus — vary speaker order so all 3 delegates contribute
  if (phase.type === "unmoderated_caucus") {
    // Use a shuffled rotation: 0,1,2,0,2,1,1,0,2... avoids same delegate always leading
    const rotations = [
      [0, 1, 2],
      [0, 2, 1],
      [1, 0, 2],
    ];
    const rotation = rotations[Math.floor(state.speakerQueueIndex / 3) % rotations.length];
    const delegateIndex = rotation[state.speakerQueueIndex % 3];
    const speech = await speakAndTrim(delegateIndex, state, phase, {
      isUnmoderated: true,
    });
    newEntries.push(
      entry("delegate", setup.delegates[delegateIndex].country, speech)
    );
    return {
      newEntries,
      advance: {
        speakerQueueIndex: state.speakerQueueIndex + 1,
        turnsThisPhase: state.turnsThisPhase + 1,
      },
    };
  }

  // Procedural phases — just transition
  if (isProc(phase.type)) {
    return transitionPhase(state);
  }

  // Opening speeches / moderated caucus — walk speakerOrder
  if (
    phase.type === "opening_speeches" ||
    phase.type === "moderated_caucus"
  ) {
    const order = phase.speakerOrder ?? [];
    const idx = state.speakerQueueIndex % (order.length || 1);
    const currentSpeaker = order[idx];

    if (!currentSpeaker || currentSpeaker === "user") {
      const chairLine = recognizeNext("user", setup.userCountry);
      newEntries.push(entry("chair", "Chair", chairLine));
      userHasFloor = true;
      return {
        newEntries,
        advance: {
          speakerQueueIndex: state.speakerQueueIndex + 1,
          turnsThisPhase: state.turnsThisPhase + newEntries.length,
          userHasFloor: true,
        },
      };
    }

    const delegateIndex = setup.delegates.findIndex(
      (d) => d.country === currentSpeaker
    );
    if (delegateIndex >= 0) {
      const chairLine = recognizeNext(currentSpeaker);
      newEntries.push(entry("chair", "Chair", chairLine));
      const speech = await speakAndTrim(delegateIndex, state, phase);
      newEntries.push(
        entry("delegate", setup.delegates[delegateIndex].country, speech)
      );
    }

    return {
      newEntries,
      advance: {
        speakerQueueIndex: state.speakerQueueIndex + 1,
        turnsThisPhase: state.turnsThisPhase + newEntries.length,
      },
    };
  }

  return { newEntries, advance: {} };
}

export async function nextTurn(state: ConferenceState): Promise<TurnResult> {
  // Session ended
  if (state.status === "ended" || state.phaseIndex >= state.plan.phases.length) {
    return {
      response: { kind: "session-ended" },
      newEntries: [],
      advance: { status: "ended" },
    };
  }

  const phase = state.plan.phases[state.phaseIndex];
  const setup = state.setup;
  const newEntries: TranscriptEntry[] = [];
  let advance: Partial<ConferenceState> = {};

  // Handle pending placard
  if (state.pendingFloorRequest?.type === "placard") {
    const chairLine = recognizeUserPlacard(setup.userCountry);
    newEntries.push(entry("chair", "Chair", chairLine));
    return {
      response: { kind: "user-floor", chairLine },
      newEntries,
      advance: {
        pendingFloorRequest: null,
        userHasFloor: true,
        turnsThisPhase: state.turnsThisPhase + 1,
      },
    };
  }

  // Handle pending motion
  if (state.pendingFloorRequest?.type === "motion") {
    const { motion, details } = state.pendingFloorRequest;
    const ack = acknowledgeMotion(setup.userCountry, motion, details, setup);
    let text: string;
    if (ack) {
      text = ack;
    } else {
      text = await chairSpeak({
        setup,
        phase,
        transcript: state.transcript,
        instruction: `The delegate of ${setup.userCountry} has submitted the following motion: "${motion}". ${details ? `Details: ${details}.` : ""} Acknowledge and respond in character as the Chair.`,
      });
    }
    newEntries.push(entry("chair", "Chair", text));
    return {
      response: { kind: "speech", speaker: "Chair", text },
      newEntries,
      advance: {
        pendingFloorRequest: null,
        turnsThisPhase: state.turnsThisPhase + 1,
      },
    };
  }

  // Open phase if not yet opened
  if (state.lastOpenedPhaseIndex !== state.phaseIndex) {
    const result = await openPhase(state);
    newEntries.push(...result.newEntries);
    advance = { ...advance, ...result.advance };

    const hasUserFloor = result.advance.userHasFloor === true;
    if (hasUserFloor) {
      return {
        response: { kind: "user-floor", chairLine: newEntries[newEntries.length - 1]?.text ?? "" },
        newEntries,
        advance,
      };
    }

    const lastEntry = newEntries[newEntries.length - 1];
    return {
      response: { kind: "speech", speaker: lastEntry?.speaker ?? "Chair", text: lastEntry?.text ?? "" },
      newEntries,
      advance,
    };
  }

  // Closing phase already opened — end the session
  if (phase.type === "closing") {
    return {
      response: { kind: "session-ended" },
      newEntries: [],
      advance: { status: "ended" },
    };
  }

  // Check phase overrun
  const timeUp = Date.now() - state.phaseStartedAt > phase.durationMs;
  const tooManyTurns =
    state.turnsThisPhase >= maxTurnsForPhase(phase) + 2;

  if (timeUp || tooManyTurns) {
    const nextIndex = state.phaseIndex + 1;
    if (nextIndex >= state.plan.phases.length) {
      return {
        response: { kind: "session-ended" },
        newEntries: [],
        advance: { status: "ended" },
      };
    }
    const result = transitionPhase(state);
    return {
      response: {
        kind: "phase-transition",
        from: phase.type,
        to: state.plan.phases[nextIndex].type,
      },
      newEntries: result.newEntries,
      advance: result.advance,
    };
  }

  // Dispatch next speaker
  const result = await dispatchSpeaker(state);
  newEntries.push(...result.newEntries);
  advance = { ...advance, ...result.advance };

  if (result.advance.userHasFloor) {
    const chairLine = newEntries.find((e) => e.role === "chair")?.text ?? "";
    return {
      response: { kind: "user-floor", chairLine },
      newEntries,
      advance,
    };
  }

  const lastEntry = newEntries[newEntries.length - 1];
  return {
    response: {
      kind: "speech",
      speaker: lastEntry?.speaker ?? "Chair",
      text: lastEntry?.text ?? "",
    },
    newEntries,
    advance,
  };
}
