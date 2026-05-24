import { chat } from "../llm";
import {
  chairSystemPrompt,
  delegateSystemPrompt,
  phaseBrief,
  compactTranscript,
} from "./prompts";
import type {
  ConferenceSetup,
  DelegateConfig,
  Phase,
  TranscriptEntry,
} from "./types";

interface ChairSpeakOpts {
  setup: ConferenceSetup;
  phase: Phase;
  transcript: TranscriptEntry[];
  instruction: string;
}

interface DelegateSpeakOpts {
  setup: ConferenceSetup;
  delegate: DelegateConfig;
  phase: Phase;
  transcript: TranscriptEntry[];
  isUnmoderated?: boolean;
}

export async function chairSpeak(opts: ChairSpeakOpts): Promise<string> {
  const { setup, phase, transcript, instruction } = opts;
  const userPrompt = [
    phaseBrief(phase),
    "",
    "RECENT TRANSCRIPT:",
    compactTranscript(transcript),
    "",
    instruction,
  ].join("\n");

  return chat({
    system: chairSystemPrompt(setup),
    user: userPrompt,
    maxTokens: 3000,
    temperature: 0.6,
  });
}

export async function delegateSpeak(opts: DelegateSpeakOpts): Promise<string> {
  const { setup, delegate, phase, transcript, isUnmoderated } = opts;
  const recognition = `The chair has recognized the delegate from ${delegate.country}. Please deliver your speech now.`;

  const userPrompt = [
    phaseBrief(phase, delegate.country),
    "",
    "RECENT TRANSCRIPT:",
    compactTranscript(transcript),
    "",
    recognition,
  ].join("\n");

  let maxTokens: number;
  if (isUnmoderated) {
    maxTokens = 1500;
  } else if (phase.type === "opening_speeches") {
    maxTokens = 4096;
  } else {
    maxTokens = 2500;
  }

  return chat({
    system: delegateSystemPrompt(setup, delegate),
    user: userPrompt,
    maxTokens,
    temperature: isUnmoderated ? 1.0 : 0.85,
  });
}
