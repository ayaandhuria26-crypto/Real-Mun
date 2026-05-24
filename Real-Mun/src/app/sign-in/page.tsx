"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all"
      style={{
        background: done || active ? "var(--color-ink)" : "transparent",
        borderColor: done || active ? "var(--color-ink)" : "var(--color-border-strong)",
        color: done || active ? "var(--color-paper)" : "var(--color-muted)",
      }}
    >
      {done ? "✓" : n}
    </div>
  );
}

function RoleButton({
  label,
  selected,
  onClick,
  isWorker,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  isWorker: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-3 rounded-lg border-2 font-medium transition-all text-sm"
      style={{
        background: selected
          ? isWorker
            ? "var(--color-accent)"
            : "var(--color-ink)"
          : "transparent",
        borderColor: selected
          ? isWorker
            ? "var(--color-accent)"
            : "var(--color-ink)"
          : "var(--color-border-strong)",
        color: selected ? "#fff" : "var(--color-ink)",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div
      className="px-4 py-3 rounded-lg text-sm"
      style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}
    >
      {msg}
    </div>
  );
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const required = params.get("required");

  const [step, setStep] = useState<"details" | "verify">("details");
  const [role, setRole] = useState<"user" | "worker">(
    required === "worker" ? "worker" : "user"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendCode() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");
      if (data.devCode) setDevCode(data.devCode);
      setEmailSent(data.sent);
      setStep("verify");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function signIn() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign-in failed");
      router.push(role === "worker" ? "/worker" : next);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <div className="gold-rule mb-6" />
      {required === "worker" && (
        <div
          className="mb-6 px-4 py-3 rounded-lg text-sm"
          style={{
            background: "rgba(184,134,11,0.08)",
            color: "var(--color-ink)",
            border: "1px solid var(--color-border-strong)",
          }}
        >
          <strong>Worker access required</strong> — sign in with the authorized
          worker email and password.
        </div>
      )}
      <h1
        className="text-3xl font-bold mb-8"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
      >
        Sign in
      </h1>

      {/* Steps */}
      <div className="flex items-center gap-3 mb-8">
        <StepDot n={1} active={step === "details"} done={step === "verify"} />
        <div className="flex-1 h-px" style={{ background: "var(--color-border-strong)" }} />
        <StepDot n={2} active={step === "verify"} done={false} />
      </div>

      {step === "details" && (
        <div className="space-y-5">
          {/* Role toggle */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-ink)" }}>
              Sign in as
            </label>
            <div className="flex gap-3">
              <RoleButton
                label="Delegate"
                selected={role === "user"}
                onClick={() => setRole("user")}
                isWorker={false}
              />
              <RoleButton
                label="Worker"
                selected={role === "worker"}
                onClick={() => setRole("worker")}
                isWorker={true}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-ink)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border text-base"
              style={{
                borderColor: "var(--color-border-strong)",
                background: "var(--color-card)",
                color: "var(--color-ink)",
              }}
              placeholder="you@example.com"
              onKeyDown={(e) => e.key === "Enter" && email.includes("@") && password.length >= 4 && sendCode()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-ink)" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border text-base"
              style={{
                borderColor: "var(--color-border-strong)",
                background: "var(--color-card)",
                color: "var(--color-ink)",
              }}
              placeholder="Min. 4 characters"
              onKeyDown={(e) => e.key === "Enter" && email.includes("@") && password.length >= 4 && sendCode()}
            />
          </div>
          {error && <ErrorBox msg={error} />}
          <button
            onClick={sendCode}
            disabled={loading || !email.includes("@") || password.length < 4}
            className="btn btn-primary w-full"
          >
            {loading ? "Sending code…" : "Continue →"}
          </button>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-5">
          {emailSent && (
            <div
              className="px-4 py-3 rounded-lg text-sm"
              style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}
            >
              Email sent — check your inbox
            </div>
          )}
          {devCode && (
            <div
              className="px-4 py-4 rounded-lg text-center"
              style={{
                background: "rgba(184,134,11,0.08)",
                border: "1px solid var(--color-border-strong)",
              }}
            >
              <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-accent)" }}>
                Your verification code
              </div>
              <div
                className="text-4xl font-mono font-bold tracking-[0.4em]"
                style={{ color: "var(--color-ink)" }}
              >
                {devCode}
              </div>
              {!emailSent && (
                <div className="text-xs mt-2" style={{ color: "var(--color-muted)" }}>
                  Email delivery unavailable — use the code above
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-ink)" }}>
              6-digit verification code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full px-4 py-3 rounded-lg border text-center text-2xl font-mono"
              style={{
                borderColor: "var(--color-border-strong)",
                background: "var(--color-card)",
                color: "var(--color-ink)",
                letterSpacing: "0.4em",
              }}
              placeholder="000000"
              onKeyDown={(e) => e.key === "Enter" && code.length === 6 && signIn()}
            />
          </div>
          {error && <ErrorBox msg={error} />}
          <button
            onClick={signIn}
            disabled={loading || code.length !== 6}
            className="btn btn-primary w-full"
          >
            {loading ? "Signing in…" : "Sign in →"}
          </button>
          <button
            onClick={() => { setStep("details"); setCode(""); setError(""); }}
            className="w-full text-sm text-center py-2"
            style={{ color: "var(--color-muted)" }}
          >
            Resend code
          </button>
        </div>
      )}
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
