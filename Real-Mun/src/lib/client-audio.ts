import { DELEGATE_VOICE_PROFILES } from "./voices";

let keepAliveInterval: ReturnType<typeof setInterval> | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;
let activeTtsController: AbortController | null = null;
let speechGeneration = 0;
let finishCurrentAudio: (() => void) | null = null;
let finishBrowserSpeech: (() => void) | null = null;

export function stopAllSpeech(): void {
  speechGeneration += 1;
  activeTtsController?.abort();
  activeTtsController = null;
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
  finishBrowserSpeech?.();
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  finishCurrentAudio?.();
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
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

    let settled = false;
    const finish = (cancel = false) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
      if (finishBrowserSpeech === finish) finishBrowserSpeech = null;
      if (cancel) window.speechSynthesis.cancel();
      resolve();
    };

    const timeout = setTimeout(() => finish(true), maxPlayMs(text));
    finishBrowserSpeech = finish;

    utter.onend = () => finish();

    utter.onerror = () => finish();

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

  const generation = speechGeneration;
  const controller = new AbortController();
  activeTtsController = controller;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    timeout = setTimeout(() => controller.abort(), 12_000);

    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (timeout) clearTimeout(timeout);
    timeout = null;
    if (generation !== speechGeneration || controller.signal.aborted) return;

    if (!res.ok) throw new Error(`TTS fetch failed: ${res.status}`);

    const blob = await res.blob();
    if (generation !== speechGeneration || controller.signal.aborted) return;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    currentAudioUrl = url;

    const cleanup = () => {
      if (currentAudio === audio) currentAudio = null;
      if (currentAudioUrl === url) {
        URL.revokeObjectURL(url);
        currentAudioUrl = null;
      }
    };

    await new Promise<void>((resolve) => {
      let finished = false;
      let audioTimeout: ReturnType<typeof setTimeout>;
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(audioTimeout);
        cleanup();
        if (finishCurrentAudio === finish) finishCurrentAudio = null;
        resolve();
      };
      finishCurrentAudio = finish;
      audioTimeout = setTimeout(() => {
        audio.pause();
        audio.src = "";
        finish();
      }, maxPlayMs(text));
      audio.onended = () => {
        finish();
      };
      audio.onerror = () => {
        finish();
      };
      try {
        audio.play().catch(() => {
          finish();
        });
      } catch {
        finish();
      }
    });
  } catch {
    if (generation !== speechGeneration || controller.signal.aborted) return;
    return speakBrowser(text, 0);
  } finally {
    if (timeout) clearTimeout(timeout);
    if (activeTtsController === controller) activeTtsController = null;
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
  let stopPromise: Promise<string> | null = null;
  let stopped = false;
  let ended = false;

  recognition.onresult = (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
    if (stopped || ended) return;
    let rebuilt = "";
    for (let i = 0; i < event.results.length; i++) {
      rebuilt += event.results[i][0].transcript;
    }
    finalText = rebuilt;
    onPartial(finalText);
  };

  recognition.onend = () => {
    ended = true;
    if (resolveStop && !stopped) {
      stopped = true;
      resolveStop(finalText);
      resolveStop = null;
    }
  };

  recognition.onerror = () => {
    ended = true;
    if (resolveStop && !stopped) {
      stopped = true;
      resolveStop(finalText);
      resolveStop = null;
    }
  };

  recognition.start();

  return {
    stop: () => {
      if (stopPromise) return stopPromise;
      stopPromise = new Promise<string>((resolve) => {
        if (ended || stopped) {
          stopped = true;
          resolve(finalText);
          return;
        }
        resolveStop = resolve;
        try {
          recognition.stop();
        } catch {
          if (!stopped) {
            stopped = true;
            resolve(finalText);
            resolveStop = null;
          }
        }
      });
      return stopPromise;
    },
    cancel: () => {
      stopped = true;
      resolveStop?.(finalText);
      resolveStop = null;
      try {
        recognition.abort();
      } catch {
        // ignore
      }
    },
  };
}

export function createRecorder(): {
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
  cancel: () => void;
} {
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let streamRef: MediaStream | null = null;
  let resolveStop: ((blob: Blob) => void) | null = null;
  let cancelled = false;
  let startPromise: Promise<void> | null = null;

  const mimeTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
  ];

  const supportedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || "";

  return {
    start: () => {
      chunks = [];
      cancelled = false;
      startPromise = (async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
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
      })();
      return startPromise;
    },
    stop: async () => {
      if (startPromise) await startPromise;
      return new Promise<Blob>((resolve) => {
        resolveStop = resolve;
        if (mediaRecorder?.state === "recording") {
          mediaRecorder.stop();
        } else {
          streamRef?.getTracks().forEach((track) => track.stop());
          streamRef = null;
          resolve(new Blob(chunks, { type: supportedMime || "audio/webm" }));
        }
      });
    },
    cancel: () => {
      cancelled = true;
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
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
