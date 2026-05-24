import { DELEGATE_VOICE_PROFILES } from "./voices";

let keepAliveInterval: ReturnType<typeof setInterval> | null = null;
let currentAudio: HTMLAudioElement | null = null;

export function stopAllSpeech(): void {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

function maxPlayMs(text: string): number {
  return Math.max(8000, (text.length / 14) * 1000 + 5000);
}

function findVoice(hints: string[]): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  for (const hint of hints) {
    const v = voices.find((v) => v.name.includes(hint));
    if (v) return v;
  }
  return voices.find((v) => v.lang.startsWith("en")) ?? null;
}

export function speakBrowser(text: string, delegateIndex: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();

    window.speechSynthesis.cancel();
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }

    const profile = DELEGATE_VOICE_PROFILES[delegateIndex % DELEGATE_VOICE_PROFILES.length];
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = profile.rate;
    utter.pitch = profile.pitch;
    utter.lang = "en-US";

    const trySetVoice = () => {
      const voice = findVoice(profile.voiceHint);
      if (voice) utter.voice = voice;
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      trySetVoice();
    } else {
      window.speechSynthesis.addEventListener("voiceschanged", trySetVoice, {
        once: true,
      });
    }

    const timeout = setTimeout(resolve, maxPlayMs(text));

    utter.onend = () => {
      clearTimeout(timeout);
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
      resolve();
    };

    utter.onerror = () => {
      clearTimeout(timeout);
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
      resolve();
    };

    keepAliveInterval = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10_000);

    window.speechSynthesis.speak(utter);
  });
}

export async function speakChair(text: string): Promise<void> {
  if (typeof window === "undefined") return;

  if (text.length < 30) {
    return speakBrowser(text, 0);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error(`TTS fetch failed: ${res.status}`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, maxPlayMs(text));
      audio.onended = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        currentAudio = null;
        resolve();
      };
      audio.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        currentAudio = null;
        resolve();
      };
      audio.play().catch(() => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        currentAudio = null;
        resolve();
      });
    });
  } catch {
    return speakBrowser(text, 0);
  }
}

export function isWebSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );
}

export function startWebSpeech(onPartial: (text: string) => void): {
  stop: () => Promise<string>;
  cancel: () => void;
} {
  type SpeechRecognitionCtor = new () => unknown;
  const SpeechRecognition =
    (window as Window & { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognition = new (SpeechRecognition as any)();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  let finalText = "";
  let resolveStop: ((text: string) => void) | null = null;
  let stopped = false;

  recognition.onresult = (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
    let rebuilt = "";
    for (let i = 0; i < event.results.length; i++) {
      rebuilt += event.results[i][0].transcript;
    }
    finalText = rebuilt;
    onPartial(finalText);
  };

  recognition.onend = () => {
    if (resolveStop && !stopped) {
      stopped = true;
      resolveStop(finalText);
    }
  };

  recognition.onerror = () => {
    if (resolveStop && !stopped) {
      stopped = true;
      resolveStop(finalText);
    }
  };

  recognition.start();

  return {
    stop: () =>
      new Promise<string>((resolve) => {
        resolveStop = resolve;
        try {
          recognition.stop();
        } catch {
          if (!stopped) {
            stopped = true;
            resolve(finalText);
          }
        }
      }),
    cancel: () => {
      stopped = true;
      try {
        recognition.abort();
      } catch {
        // ignore
      }
    },
  };
}

export function createRecorder(): {
  start: () => void;
  stop: () => Promise<Blob>;
  cancel: () => void;
} {
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let streamRef: MediaStream | null = null;
  let resolveStop: ((blob: Blob) => void) | null = null;

  const mimeTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
  ];

  const supportedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || "";

  return {
    start: async () => {
      chunks = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef = stream;
      mediaRecorder = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : {});
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: supportedMime || "audio/webm" });
        streamRef?.getTracks().forEach((t) => t.stop());
        streamRef = null;
        resolveStop?.(blob);
      };
      mediaRecorder.start();
    },
    stop: () =>
      new Promise<Blob>((resolve) => {
        resolveStop = resolve;
        mediaRecorder?.stop();
      }),
    cancel: () => {
      mediaRecorder?.stop();
      streamRef?.getTracks().forEach((t) => t.stop());
      streamRef = null;
    },
  };
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, "recording.webm");
  const res = await fetch("/api/stt", { method: "POST", body: form });
  if (!res.ok) throw new Error(`STT error ${res.status}`);
  const data = await res.json();
  return data.text ?? "";
}
