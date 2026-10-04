export const MAX_SESSION_USER_SPEECH_CHARS = 70_000;
export const MAX_SESSION_TRANSCRIPT_CHARS = 100_000;

export type Persona =
  | "diplomatic"
  | "aggressive"
  | "coalition_builder"
  | "technical"
  | "quiet";

export interface DelegateConfig {
  id: "d1" | "d2" | "d3";
  country: string;
  persona: Persona;
  shortDescription: string;
}

export interface ConferenceSetup {
  committee: string;
  topic: string;
  userCountry: string;
  delegates: [DelegateConfig, DelegateConfig, DelegateConfig];
  totalDurationMs: number;
}

export type PhaseType =
  | "roll_call"
  | "motion_open_debate"
  | "gsl_setup"
  | "opening_speeches"
  | "motion_mod_caucus"
  | "moderated_caucus"
  | "motion_unmod_caucus"
  | "unmoderated_caucus"
  | "voting"
  | "closing";

export interface Phase {
  type: PhaseType;
  topicFocus?: string;
  durationMs: number;
  individualSpeakingTimeSec?: number;
  speakerOrder?: string[];
  description?: string;
}

export interface SessionPlan {
  phases: Phase[];
}

export interface TranscriptEntry {
  id: string;
  role: "chair" | "delegate" | "user" | "system";
  speaker: string;
  text: string;
  timestamp: number;
}

export type FloorRequest =
  | { type: "placard" }
  | { type: "motion"; motion: string; details?: string }
  | null;

export interface ConferenceState {
  setup: ConferenceSetup;
  plan: SessionPlan;
  phaseIndex: number;
  lastOpenedPhaseIndex: number;
  speakerQueueIndex: number;
  turnsThisPhase: number;
  phaseStartedAt: number;
  sessionStartedAt: number;
  transcript: TranscriptEntry[];
  pendingFloorRequest: FloorRequest;
  userHasFloor: boolean;
  userSpeechCount: number;
  status: "active" | "ended";
  endReason?: "transcript-limit";
}

export type TurnResponse =
  | { kind: "speech"; speaker: string; text: string }
  | { kind: "user-floor"; chairLine: string }
  | { kind: "phase-transition"; from: PhaseType; to: PhaseType }
  | { kind: "session-ended"; reason?: "transcript-limit" };

export interface TurnResult {
  response: TurnResponse;
  newEntries: TranscriptEntry[];
  advance: Partial<ConferenceState>;
}
