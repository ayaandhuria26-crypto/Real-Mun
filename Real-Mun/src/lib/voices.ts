export type BrowserVoiceProfile = {
  voiceHint: string[];
  rate: number;
  pitch: number;
};

export const DELEGATE_VOICE_PROFILES: BrowserVoiceProfile[] = [
  { voiceHint: ["Google UK English Male", "Daniel", "Microsoft George"], rate: 1.0, pitch: 0.95 },
  { voiceHint: ["Google US English", "Samantha", "Microsoft Zira"], rate: 1.05, pitch: 1.1 },
  { voiceHint: ["Google UK English Female", "Karen", "Microsoft Hazel"], rate: 0.95, pitch: 1.0 },
];
