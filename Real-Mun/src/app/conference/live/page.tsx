"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ConferenceState, TranscriptEntry, TurnResult } from "@/lib/conference/types";
import {
  MAX_SESSION_TRANSCRIPT_CHARS,
  MAX_SESSION_USER_SPEECH_CHARS,
} from "@/lib/conference/types";
import TranscriptFeed from "@/components/conference/TranscriptFeed";
import PhaseProgress from "@/components/conference/PhaseProgress";
import VoiceVisualizer from "@/components/conference/VoiceVisualizer";
import SessionFeedback, { type SessionFeedbackResult } from "@/components/conference/SessionFeedback";
import { saveConferenceReview } from "@/lib/review-storage";
import {
  speakChair,
  speakBrowser,
  stopAllSpeech,
  isWebSpeechSupported,
  startWebSpeech,
  createRecorder,
  transcribeAudio,
} from "@/lib/client-audio";

const MOTIONS = [
  { label: "Moderated Caucus", value: "Moderated Caucus", needsDetails: true, hint: "Topic, total time, speaking time…" },
  { label: "Unmoderated Caucus", value: "Unmoderated Caucus", needsDetails: true, hint: "Total time…" },
  { label: "Extend Current Caucus", value: "Extend Current Caucus", needsDetails: true, hint: "Extension time…" },
  { label: "Introduce a Draft Resolution", value: "Introduce a Draft Resolution", needsDetails: false, hint: "" },
  { label: "Point of Inquiry", value: "Point of Inquiry", needsDetails: true, hint: "Your question…" },
  { label: "Point of Order", value: "Point of Order", needsDetails: true, hint: "Describe the breach…" },
  { label: "Motion to Close Debate", value: "Motion to Close Debate", needsDetails: false, hint: "" },
];

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function newEntry(
  role: TranscriptEntry["role"],
  speaker: string,
  text: string
): TranscriptEntry {
  return { id: Math.random().toString(36).slice(2), role, speaker, text, timestamp: Date.now() };
}

export default function LiveConferencePage() {
  const router = useRouter();
  const [state, setState] = useState<ConferenceState | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [turnLoading, setTurnLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [motionOpen, setMotionOpen] = useState(false);
  const [selectedMotion, setSelectedMotion] = useState("");
  const [motionDetails, setMotionDetails] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [draftSpeech, setDraftSpeech] = useState("");
  const [feedback, setFeedback] = useState<SessionFeedbackResult | null>(null);
  const [feedbackRetry, setFeedbackRetry] = useState(0);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [archiveNotice, setArchiveNotice] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [floorJustOpened, setFloorJustOpened] = useState(false);

  const inFlightRef = useRef(false);
  const turnEpochRef = useRef(0);
  const turnControllerRef = useRef<AbortController | null>(null);
  const pausedRef = useRef(false);
  const captureGenerationRef = useRef(0);
  const stateRef = useRef<ConferenceState | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const prevUserHasFloorRef = useRef(false);
  const webSpeechRef = useRef<{ stop: () => Promise<string>; cancel: () => void } | null>(null);
  const recorderRef = useRef<ReturnType<typeof createRecorder> | null>(null);

  // Load initial state from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem("conferenceState");
    if (!raw) {
      router.push("/conference");
      return;
    }
    try {
      const s = JSON.parse(raw) as ConferenceState;
      setState(s);
      stateRef.current = s;
    } catch {
      router.push("/conference");
    }
  }, [router]);

  // Persist state changes to sessionStorage
  useEffect(() => {
    if (!state) return;
    stateRef.current = state;
    sessionStorage.setItem("conferenceState", JSON.stringify(state));
  }, [state]);

  // Clock
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  // Stop speech and microphone capture if the user leaves the live session.
  useEffect(() => () => {
    turnEpochRef.current += 1;
    turnControllerRef.current?.abort();
    turnControllerRef.current = null;
    inFlightRef.current = false;
    stopAllSpeech();
    webSpeechRef.current?.cancel();
    recorderRef.current?.cancel();
    webSpeechRef.current = null;
    recorderRef.current = null;
    captureGenerationRef.current += 1;
  }, []);

  // Floor-open effect
  useEffect(() => {
    if (!state) return;
    const wasFloor = prevUserHasFloorRef.current;
    const isFloor = state.userHasFloor;
    prevUserHasFloorRef.current = isFloor;

    if (!wasFloor && isFloor) {
      setFloorJustOpened(true);
      setTimeout(() => setFloorJustOpened(false), 3000);
      // Chime
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.65);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.65);
      } catch { /* ignore */ }
      // Scroll dock into view
      setTimeout(() => {
        dockRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        draftRef.current?.focus();
      }, 200);
    }
  }, [state?.userHasFloor]);

  // Fetch feedback when session ends (with retry for rate limits)
  useEffect(() => {
    if (!state || state.status !== "ended" || feedback || loadingFeedback) return;
    const endedState = state;
    const feedbackController = new AbortController();
    setLoadingFeedback(true);

    async function fetchFeedback(attempt = 0): Promise<void> {
      if (feedbackController.signal.aborted) return;
      try {
        const r = await fetch("/api/conference/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: endedState }),
          signal: feedbackController.signal,
        });
        const d = await r.json();
        if (!r.ok) {
          const retryLimit = r.status === 429 ? 3 : r.status >= 500 ? 1 : 0;
          if (attempt < retryLimit) {
            await new Promise((res) => setTimeout(res, 3000 * (attempt + 1)));
            return fetchFeedback(attempt + 1);
          }
          setFeedback({ error: d.error || "Feedback generation failed. Please try again." });
          return;
        }
        if (!d.feedback) {
          setFeedback({ error: "Feedback response was incomplete. Please try again." });
          return;
        }
        const result = d.feedback as SessionFeedbackResult;
        if ("error" in result) {
          setFeedback(result);
          return;
        }
        const saved = saveConferenceReview({
          id: `conference-${endedState.sessionStartedAt}`,
          createdAt: endedState.sessionStartedAt,
          committee: endedState.setup.committee,
          country: endedState.setup.userCountry,
          topic: endedState.setup.topic,
          durationMs: Math.max(0, Date.now() - endedState.sessionStartedAt),
          speeches: endedState.transcript
            .filter((entry) => entry.role === "user")
            .map((entry) => entry.text),
          feedback: result,
        });
        setArchiveNotice(saved ? "Review saved on this device." : "This review could not be saved on this device.");
        setFeedback(result);
      } catch {
        if (feedbackController.signal.aborted) return;
        if (attempt < 3) {
          await new Promise((res) => setTimeout(res, 3000 * (attempt + 1)));
          return fetchFeedback(attempt + 1);
        }
        setFeedback({ error: "Failed to load feedback. Please try again." });
      } finally {
        if (!feedbackController.signal.aborted && (attempt === 0 || attempt >= 3)) {
          setLoadingFeedback(false);
        }
      }
    }

    fetchFeedback().finally(() => {
      if (!feedbackController.signal.aborted) setLoadingFeedback(false);
    });
    return () => feedbackController.abort();
  }, [state?.status, feedbackRetry]);

  function applyServerResult(result: TurnResult, prevState: ConferenceState): ConferenceState {
    const merged: ConferenceState = {
      ...prevState,
      ...result.advance,
      transcript: [...prevState.transcript, ...result.newEntries],
    };
    if (result.response.kind === "session-ended") {
      merged.status = "ended";
    }
    return merged;
  }

  const runNextTurn = useCallback(async () => {
    if (inFlightRef.current) return;
    const s = stateRef.current;
    if (!s || s.status === "ended" || s.userHasFloor || paused) return;
    const requestEpoch = turnEpochRef.current;
    const turnController = new AbortController();
    turnControllerRef.current = turnController;
    inFlightRef.current = true;
    setTurnLoading(true);
    setError("");
    try {
      const res = await fetch("/api/conference/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: s }),
        signal: turnController.signal,
      });
      const result: TurnResult = await res.json();
      if (!res.ok) throw new Error((result as unknown as { error: string }).error || "Turn failed");

      const latestState = stateRef.current;
      if (
        turnEpochRef.current !== requestEpoch ||
        pausedRef.current ||
        !latestState ||
        latestState.status === "ended" ||
        latestState.phaseIndex !== s.phaseIndex
      ) {
        return;
      }

      const newState = applyServerResult(result, latestState);
      setState(newState);
      stateRef.current = newState;

      // Play audio for new entries
      for (const entry of result.newEntries) {
        if (
          turnEpochRef.current !== requestEpoch ||
          pausedRef.current ||
          stateRef.current?.status === "ended" ||
          stateRef.current?.phaseIndex !== newState.phaseIndex
        ) break;
        if (entry.role === "system") continue;
        setSpeakingId(entry.id);
        try {
          if (entry.role === "chair") {
            await speakChair(entry.text);
          } else if (entry.role === "delegate") {
            const idx = s.setup.delegates.findIndex((d) => d.country === entry.speaker);
            await speakBrowser(entry.text, idx >= 0 ? idx : 0);
          }
        } finally {
          setSpeakingId(null);
        }
      }

      if (result.response.kind === "session-ended") {
        setState((prev) => prev ? { ...prev, status: "ended" } : prev);
      }
    } catch (e) {
      if (
        turnEpochRef.current === requestEpoch &&
        !pausedRef.current &&
        stateRef.current?.status !== "ended" &&
        stateRef.current?.phaseIndex === s.phaseIndex
      ) {
        setError((e as Error).message);
      }
    } finally {
      if (turnControllerRef.current === turnController) {
        turnControllerRef.current = null;
      }
      if (turnEpochRef.current === requestEpoch) {
        setTurnLoading(false);
        inFlightRef.current = false;
      }
    }
  }, [paused]);

  // Auto-advance loop
  useEffect(() => {
    // Keep a failed turn from being retried every 500ms. The user can resume
    // the conference after checking the displayed error.
    if (!state || state.status === "ended" || state.userHasFloor || paused || turnLoading || error) return;
    const t = setTimeout(() => { runNextTurn(); }, 500);
    return () => clearTimeout(t);
  }, [state, paused, turnLoading, runNextTurn, error]);

  function raisePlacard() {
    setError("");
    setState((prev) =>
      prev ? { ...prev, pendingFloorRequest: { type: "placard" } } : prev
    );
  }

  function submitMotion() {
    if (!selectedMotion) return;
    setError("");
    setState((prev) =>
      prev
        ? {
            ...prev,
            pendingFloorRequest: {
              type: "motion",
              motion: selectedMotion,
              details: motionDetails || undefined,
            },
          }
        : prev
    );
    setMotionOpen(false);
    setSelectedMotion("");
    setMotionDetails("");
  }

  function cancelActiveCapture() {
    captureGenerationRef.current += 1;
    webSpeechRef.current?.cancel();
    webSpeechRef.current = null;
    recorderRef.current?.cancel();
    recorderRef.current = null;
    setRecording(false);
    setTranscribing(false);
  }

  async function startRecording() {
    if (recording || transcribing) return;
    if (isWebSpeechSupported()) {
      setRecording(true);
      const generation = captureGenerationRef.current;
      try {
        webSpeechRef.current = startWebSpeech((partial) => {
          if (generation === captureGenerationRef.current) setDraftSpeech(partial);
        });
        setError("");
      } catch {
        captureGenerationRef.current += 1;
        webSpeechRef.current = null;
        setRecording(false);
        setError("Browser speech recognition could not start. Check microphone permissions or type your speech instead.");
      }
    } else {
      setRecording(true);
      let recorder: ReturnType<typeof createRecorder> | null = null;
      try {
        recorder = createRecorder();
        recorderRef.current = recorder;
        await recorder.start();
        if (recorderRef.current === recorder) setError("");
      } catch {
        if (recorder && recorderRef.current !== recorder) return;
        captureGenerationRef.current += 1;
        recorder?.cancel();
        recorderRef.current = null;
        setRecording(false);
        setTranscribing(false);
        setError("Microphone recording is unavailable. Check your browser permissions or type your speech instead.");
      }
    }
  }

  async function stopRecording() {
    if (webSpeechRef.current) {
      const recognition = webSpeechRef.current;
      const generation = captureGenerationRef.current;
      setRecording(false);
      setTranscribing(true);
      try {
        const text = await recognition.stop();
        if (webSpeechRef.current === recognition) webSpeechRef.current = null;
        if (generation === captureGenerationRef.current) setDraftSpeech(text);
      } finally {
        if (generation === captureGenerationRef.current) setTranscribing(false);
      }
    } else if (recorderRef.current) {
      const recorder = recorderRef.current;
      const generation = captureGenerationRef.current;
      setRecording(false);
      setTranscribing(true);
      try {
        const blob = await recorder.stop();
        if (recorderRef.current === recorder) recorderRef.current = null;
        if (generation !== captureGenerationRef.current) return;
        const text = await transcribeAudio(blob);
        if (generation === captureGenerationRef.current) {
          setDraftSpeech((prev) => (prev ? prev + " " + text : text));
        }
      } catch {
        if (generation === captureGenerationRef.current) {
          setError("Transcription failed — try typing instead.");
        }
      } finally {
        if (generation === captureGenerationRef.current) setTranscribing(false);
      }
      return;
    }
    setRecording(false);
  }

  function deliverSpeech() {
    if (!draftSpeech.trim() || !state || recording || transcribing) return;
    const text = draftSpeech.trim();
    if (text.length > 10_000) {
      setDraftSpeech(text.slice(0, 10_000));
      setError("Speech is limited to 10,000 characters. The draft was shortened to fit.");
      return;
    }
    const existingUserSpeechChars = state.transcript.reduce(
      (total, entry) => total + (entry.role === "user" ? entry.text.length : 0),
      0
    );
    if (existingUserSpeechChars + text.length > MAX_SESSION_USER_SPEECH_CHARS) {
      setError("This session has reached its total speech limit. End the session to receive feedback on speeches so far.");
      return;
    }
    const existingTranscriptChars = state.transcript.reduce(
      (total, entry) => total + entry.text.length,
      0
    );
    if (existingTranscriptChars + text.length > MAX_SESSION_TRANSCRIPT_CHARS) {
      setError("The session transcript has reached its limit. End the session to receive feedback on speeches so far.");
      return;
    }
    setError("");
    const e = newEntry("user", state.setup.userCountry, text);
    setState((prev) =>
      prev
        ? {
            ...prev,
            transcript: [...prev.transcript, e],
            userHasFloor: false,
            userSpeechCount: prev.userSpeechCount + 1,
          }
        : prev
    );
    setDraftSpeech("");
  }

  function yieldFloor() {
    cancelActiveCapture();
    setError("");
    setState((prev) => (prev ? { ...prev, userHasFloor: false } : prev));
    setDraftSpeech("");
  }

  function skipPhase() {
    if (!confirm("Skip to next phase?")) return;
    turnEpochRef.current += 1;
    turnControllerRef.current?.abort();
    turnControllerRef.current = null;
    inFlightRef.current = false;
    setTurnLoading(false);
    stopAllSpeech();
    cancelActiveCapture();
    setError("");
    setDraftSpeech("");
    setState((prev) => {
      if (!prev) return prev;
      const next = prev.phaseIndex + 1;
      return {
        ...prev,
        phaseIndex: next,
        status: next >= prev.plan.phases.length ? "ended" : prev.status,
        lastOpenedPhaseIndex: prev.lastOpenedPhaseIndex,
        speakerQueueIndex: 0,
        turnsThisPhase: 0,
        phaseStartedAt: Date.now(),
        pendingFloorRequest: null,
        userHasFloor: false,
      };
    });
  }

  function endSession() {
    if (!confirm("End the session now?")) return;
    turnEpochRef.current += 1;
    turnControllerRef.current?.abort();
    turnControllerRef.current = null;
    inFlightRef.current = false;
    setTurnLoading(false);
    stopAllSpeech();
    cancelActiveCapture();
    setState((prev) => (prev ? { ...prev, status: "ended" } : prev));
  }

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ color: "var(--color-muted)" }}>Loading session…</div>
      </div>
    );
  }

  const currentPhase = state.plan.phases[state.phaseIndex];
  const phaseElapsed = now - state.phaseStartedAt;
  const phaseRemaining = Math.max(0, (currentPhase?.durationMs ?? 0) - phaseElapsed);
  const sessionElapsed = now - state.sessionStartedAt;
  const motionObj = MOTIONS.find((m) => m.value === selectedMotion);

  // End of session screen
  if (state.status === "ended") {
    return (
      <div className="max-w-4xl mx-auto px-5 py-12">
        {/* Header */}
        <div className="rounded-2xl px-6 py-6 mb-8"
          style={{ background: "var(--color-ink)" }}>
          <div className="text-xs font-mono uppercase tracking-widest mb-3"
            style={{ color: "var(--color-accent)" }}>
            Session complete
          </div>
          <h1 className="text-3xl font-bold mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-paper)" }}>
            {state.setup.committee}
          </h1>
          <p style={{ color: "rgba(245,243,237,0.6)" }}>
            {state.setup.topic} · {state.userSpeechCount} speech{state.userSpeechCount !== 1 ? "es" : ""} given as {state.setup.userCountry}
          </p>
          {state.endReason === "transcript-limit" && (
            <p className="mt-3 text-sm" style={{ color: "var(--color-accent)" }}>
              The transcript reached its size limit, so the session ended to keep feedback available.
            </p>
          )}
        </div>

        {loadingFeedback && (
          <div className="card p-8 text-center mb-8">
            <div className="inline-flex gap-1 mb-4">
              <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ color: "var(--color-accent)", animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ color: "var(--color-accent)", animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ color: "var(--color-accent)", animationDelay: "300ms" }} />
            </div>
            <div className="text-base font-medium mb-1" style={{ color: "var(--color-ink)" }}>
              Generating feedback
            </div>
            <div className="text-sm" style={{ color: "var(--color-muted)" }}>
              Analysing {state.userSpeechCount} speech{state.userSpeechCount !== 1 ? "es" : ""} against 3 dimensions…
            </div>
          </div>
        )}
        {feedback && !loadingFeedback && (
          <SessionFeedback
            feedback={feedback}
            onRetry={() => {
              setFeedback(null);
              setFeedbackRetry((attempt) => attempt + 1);
            }}
          />
        )}
        {archiveNotice && (
          <p className="mt-4 text-sm" style={{ color: "var(--color-muted)" }}>
            {archiveNotice}{" "}
            {archiveNotice.startsWith("Review saved") && (
              <Link href="/reviews" className="font-medium underline" style={{ color: "var(--color-accent)" }}>
                View My Reviews
              </Link>
            )}
          </p>
        )}
        <div className="flex gap-4 mt-8">
          <button onClick={() => router.push("/conference")} className="btn btn-primary">
            Start a new session
          </button>
          <button onClick={() => router.push("/")} className="btn btn-secondary">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const isRollCall = currentPhase?.type === "roll_call";
  const upNext = !state.userHasFloor &&
    currentPhase?.speakerOrder?.[state.speakerQueueIndex % (currentPhase.speakerOrder?.length || 1)] === "user";

  return (
    <div style={{ background: "var(--color-paper)", minHeight: "100vh" }}>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-30 px-4 py-3"
        style={{
          background: "var(--color-ink)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs font-mono uppercase tracking-wide mb-0.5"
              style={{ color: "rgba(245,243,237,0.5)" }}>
              {currentPhase?.type?.replace(/_/g, " ").toUpperCase()}
            </div>
            <div className="text-sm font-medium truncate max-w-xs" style={{ color: "var(--color-paper)" }}>
              {currentPhase?.topicFocus ?? state.setup.topic}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-mono" style={{ color: "var(--color-accent)" }}>
              Phase: {formatTime(phaseRemaining)}
            </div>
            <div className="text-xs" style={{ color: "rgba(245,243,237,0.5)" }}>
              Total: {formatTime(sessionElapsed)}
            </div>
            <button
              onClick={() => {
                const nextPaused = !paused;
                pausedRef.current = nextPaused;
                setPaused(nextPaused);
                if (nextPaused) stopAllSpeech();
              }}
              className="btn text-xs px-3 py-1.5"
              style={{ background: "rgba(255,255,255,0.1)", color: "var(--color-paper)", borderRadius: "6px" }}
            >
              {paused ? "▶ Resume" : "⏸ Pause"}
            </button>
            {error && (
              <button
                onClick={() => {
                  pausedRef.current = false;
                  setPaused(false);
                  setError("");
                }}
                className="btn text-xs px-3 py-1.5"
                style={{ background: "rgba(255,255,255,0.1)", color: "var(--color-paper)", borderRadius: "6px" }}
              >
                Retry turn
              </button>
            )}
            <button
              onClick={skipPhase}
              className="btn text-xs px-3 py-1.5"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(245,243,237,0.7)", borderRadius: "6px" }}
            >
              Skip phase
            </button>
            <button
              onClick={endSession}
              className="btn text-xs px-3 py-1.5"
              style={{ background: "rgba(220,38,38,0.2)", color: "#fca5a5", borderRadius: "6px" }}
            >
              End session
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Phase progress */}
        <PhaseProgress phases={state.plan.phases} currentIndex={state.phaseIndex} />

        {/* Delegates strip */}
        <div className="flex gap-3 my-4 flex-wrap">
          {/* Chair */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}>
              C
            </div>
            <div>
              <div className="font-medium" style={{ color: "var(--color-ink)" }}>Chair</div>
              <div style={{ color: "var(--color-muted)" }}>Moderator</div>
            </div>
          </div>
          {/* Delegates */}
          {state.setup.delegates.map((d, i) => {
            const isActive = speakingId && state.transcript.find(e => e.id === speakingId)?.speaker === d.country;
            return (
              <div key={d.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${isActive ? "speaking-ring" : ""}`}
                style={{
                  background: "var(--color-card)",
                  border: isActive ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: isActive ? "var(--color-accent)" : "var(--color-surface)", color: isActive ? "#fff" : "var(--color-ink)" }}>
                  {d.country[0]}
                </div>
                <div>
                  <div className="font-medium" style={{ color: "var(--color-ink)" }}>{d.country}</div>
                  <div style={{ color: "var(--color-muted)" }}>{d.persona.replace("_", " ")}</div>
                </div>
                {isActive && <span className="ml-1 text-xs" style={{ color: "var(--color-accent)" }}>· speaking</span>}
              </div>
            );
          })}
        </div>

        {/* You */}
        <div className="flex items-center gap-3 mb-3 text-sm">
          <span style={{ color: "var(--color-muted)" }}>You are</span>
          <span className="font-semibold" style={{ color: "var(--color-ink)" }}>
            {state.setup.userCountry}
          </span>
          <span style={{ color: "var(--color-muted)" }}>·</span>
          <span style={{ color: "var(--color-muted)" }}>
            {state.userSpeechCount} speech{state.userSpeechCount !== 1 ? "es" : ""}
          </span>
          {upNext && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(184,134,11,0.15)", color: "var(--color-accent)" }}>
              ⬇ You&rsquo;re up next
            </span>
          )}
        </div>

        {/* Floor-just-opened banner */}
        {floorJustOpened && (
          <div className="mb-3 px-4 py-4 rounded-xl text-sm font-semibold text-center"
            style={{
              background: "var(--color-accent)",
              color: "var(--color-ink)",
              boxShadow: "0 8px 24px -8px rgba(184,134,11,0.5)",
            }}>
            THE FLOOR IS YOURS — deliver your speech below
          </div>
        )}

        {error && (
          <div className="mb-3 px-4 py-2 rounded-lg text-sm"
            style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>
            {error}
          </div>
        )}

        {/* Transcript */}
        <TranscriptFeed
          transcript={state.transcript}
          speakingId={speakingId}
          userCountry={state.setup.userCountry}
        />

        {/* Bottom dock */}
        <div ref={dockRef} className="mt-4">
          {state.userHasFloor ? (
            <div className="card">
              {isRollCall ? (
                /* Roll call buttons */
                <div>
                  <div className="text-sm font-medium mb-3" style={{ color: "var(--color-ink)" }}>
                    Respond to roll call
                  </div>
                  <div className="flex gap-3">
                    {["Present.", "Present and voting."].map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          const e = newEntry("user", state.setup.userCountry, r);
                          setState((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  transcript: [...prev.transcript, e],
                                  userHasFloor: false,
                                }
                              : prev
                          );
                        }}
                        className="btn btn-primary"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Speech dock */
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
                        Your speech — {state.setup.userCountry}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                        {currentPhase?.type === "opening_speeches"
                          ? "Opening statement · aim for 80–130 words"
                          : currentPhase?.type === "moderated_caucus"
                          ? "Moderated caucus · aim for 50–90 words"
                          : "Aim for 50–100 words"}
                      </div>
                    </div>
                    <button
                      onClick={yieldFloor}
                      className="text-xs px-3 py-1.5 rounded-lg transition"
                      style={{
                        color: "var(--color-muted)",
                        border: "1px solid var(--color-border-strong)",
                        background: "transparent",
                      }}
                    >
                      Yield floor
                    </button>
                  </div>
                  <textarea
                    ref={draftRef}
                    maxLength={10_000}
                    value={draftSpeech}
                    onChange={(e) => setDraftSpeech(e.target.value)}
                    rows={5}
                    placeholder={
                      recording ? "Listening…" : "Honorable Chair, fellow delegates, …"
                    }
                    className="w-full px-3 py-2 rounded-lg border text-sm resize-y mb-2"
                    style={{
                      borderColor: draftSpeech.trim() ? "var(--color-accent)" : "var(--color-border-strong)",
                      background: "var(--color-card)",
                      color: "var(--color-ink)",
                      transition: "border-color 0.2s",
                    }}
                  />
                  <VoiceVisualizer active={recording} />
                  <div className="flex gap-3 items-center flex-wrap mb-1">
                    <button
                      onClick={recording ? stopRecording : startRecording}
                      disabled={transcribing}
                      className="btn text-sm px-4 py-2"
                      style={{
                        background: recording ? "#dc2626" : "var(--color-surface)",
                        color: recording ? "#fff" : "var(--color-ink)",
                        border: "1px solid var(--color-border-strong)",
                        borderRadius: "8px",
                      }}
                    >
                      {recording ? "Stop recording" : "Record speech"}
                    </button>
                    {transcribing && (
                      <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                        Transcribing…
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-3">
                      <span className="text-xs font-mono"
                        style={{
                          color: (() => {
                            const wc = draftSpeech.trim().split(/\s+/).filter(Boolean).length;
                            const isOpening = currentPhase?.type === "opening_speeches";
                            const minGood = isOpening ? 50 : 30;
                            const maxGood = isOpening ? 130 : 100;
                            if (wc === 0) return "var(--color-muted)";
                            if (wc < minGood) return "#ef4444";
                            if (wc <= maxGood) return "var(--color-accent)";
                            return "#f59e0b";
                          })(),
                        }}>
                        {draftSpeech.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                      <button
                        onClick={deliverSpeech}
                        disabled={!draftSpeech.trim() || recording || transcribing}
                        className="btn btn-primary text-sm"
                        style={{ background: draftSpeech.trim() ? "var(--color-ink)" : undefined }}
                      >
                        Deliver speech →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Action bar when not user's turn */
            <div className="flex gap-3 items-center justify-center flex-wrap">
              {turnLoading && (
                <div className="flex items-center gap-2 text-xs mr-2"
                  style={{ color: "var(--color-muted)" }}>
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: "var(--color-accent)", animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: "var(--color-accent)", animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: "var(--color-accent)", animationDelay: "300ms" }} />
                  </span>
                  <span>Delegate speaking</span>
                </div>
              )}
              <button
                onClick={() => setMotionOpen(true)}
                className="btn btn-secondary text-sm"
                title="Submit a motion to the Chair"
              >
                Submit Motion
              </button>
              <button
                onClick={raisePlacard}
                disabled={!!state.pendingFloorRequest}
                className="btn text-sm"
                title="Raise your placard to request the floor"
                style={{
                  background: state.pendingFloorRequest ? "var(--color-surface)" : "var(--color-ink)",
                  color: state.pendingFloorRequest ? "var(--color-muted)" : "var(--color-paper)",
                  border: "1px solid var(--color-border-strong)",
                  borderRadius: "6px",
                  opacity: state.pendingFloorRequest ? 0.6 : 1,
                }}
              >
                {state.pendingFloorRequest?.type === "placard" ? "Placard raised (pending…)" : "Raise Placard"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Motion modal */}
      {motionOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setMotionOpen(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "var(--color-card)" }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-ink)" }}>
              Submit a motion
            </h3>
            <div className="space-y-2 mb-4">
              {MOTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setSelectedMotion(m.value)}
                  className="w-full text-left px-4 py-3 rounded-lg border text-sm transition"
                  style={{
                    background: selectedMotion === m.value ? "var(--color-surface)" : "transparent",
                    borderColor: selectedMotion === m.value ? "var(--color-accent)" : "var(--color-border)",
                    color: "var(--color-ink)",
                    cursor: "pointer",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {motionObj?.needsDetails && selectedMotion && (
              <textarea
                value={motionDetails}
                onChange={(e) => setMotionDetails(e.target.value)}
                rows={2}
                placeholder={motionObj.hint}
                className="w-full px-3 py-2 rounded-lg border text-sm mb-4 resize-none"
                style={{
                  borderColor: "var(--color-border-strong)",
                  background: "var(--color-card)",
                  color: "var(--color-ink)",
                }}
              />
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setMotionOpen(false); setSelectedMotion(""); setMotionDetails(""); }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={submitMotion}
                disabled={!selectedMotion}
                className="btn btn-primary flex-1"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
