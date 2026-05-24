"use client";

import { useState, useEffect } from "react";

const COACHING_TOPICS = [
  { title: "Speech Delivery", duration: "30min", desc: "Confidence, pacing, MUN register, and staying in character." },
  { title: "Resolution Writing", duration: "45min", desc: "Preambulatory and operative clause drafting, compromise language." },
  { title: "Crisis Prep", duration: "45min", desc: "Crisis notes, backroom arcs, reading the room under pressure." },
  { title: "Position Paper Review", duration: "30min", desc: "Line-by-line review of your draft with scoring feedback." },
  { title: "Bloc & Coalition Strategy", duration: "30min", desc: "How to form blocs, trade clause language, become a main submitter." },
  { title: "Full Conference Prep", duration: "60min", desc: "Full simulation walkthrough — from roll call to closing." },
];

const COACHES = [
  {
    name: "Ayaan Dhuria",
    role: "Founder · 2 years",
    specialties: ["Full Conference Prep", "Speech Delivery", "Bloc & Coalition Strategy"],
    bio: "Founder of Real-MUN. Three competitive conferences with one Best Delegate and one Honorable Mention. Active leader at SPMS across TSA, MUN, and cricket clubs — coaches new delegates from their very first placard raise to award-eligible speeches.",
  },
];

const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM",
  "3:00 PM", "4:00 PM", "5:00 PM", "7:00 PM", "8:00 PM",
];

function nextTenDays(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 1; i <= 10; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push(d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
  }
  return days;
}

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("");
}

export default function SessionsPage() {
  const [step, setStep] = useState(1);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedCoach, setSelectedCoach] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailNote, setEmailNote] = useState<string | undefined>();
  const [days] = useState(nextTenDays);

  useEffect(() => {
    document.title = "1-on-1 Sessions · Real-MUN";
  }, []);

  const canConfirm =
    selectedTopic && selectedCoach && selectedDate && selectedTime && name && email;

  async function confirm() {
    if (!canConfirm) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic,
          coach: selectedCoach,
          date: selectedDate,
          time: selectedTime,
          name,
          email,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      setEmailNote(data.emailNote);
      setSuccess(true);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const steps = [1, 2, 3, 4, 5];

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16">
        <div className="gold-rule mb-6" />
        <h1 className="text-3xl font-bold mb-4"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
          You&rsquo;re booked!
        </h1>
        <div className="card mb-6">
          <table className="w-full text-sm">
            <tbody>
              {[
                ["Topic", selectedTopic],
                ["Coach", selectedCoach],
                ["Date", selectedDate],
                ["Time", selectedTime],
                notes ? ["Notes", notes] : null,
              ]
                .filter((item): item is string[] => item !== null)
                .map(([k, v]) => (
                  <tr key={k!} className="border-b last:border-0"
                    style={{ borderColor: "var(--color-border)" }}>
                    <td className="py-2 pr-4 font-medium" style={{ color: "var(--color-muted)" }}>
                      {k}
                    </td>
                    <td className="py-2" style={{ color: "var(--color-ink)" }}>
                      {v}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {emailNote ? (
          <div className="mb-4 p-4 rounded-lg text-sm"
            style={{ background: "rgba(184,134,11,0.08)", color: "var(--color-muted)", border: "1px solid var(--color-border-strong)" }}>
            <strong style={{ color: "var(--color-ink)" }}>Note:</strong> We couldn&apos;t auto-email a
            confirmation. Your coach will reach out manually within 24 hours.
          </div>
        ) : (
          <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
            A confirmation email has been sent to {email}. Your coach will follow up
            with a meeting link closer to the session.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-12" style={{ minHeight: "100vh" }}>
      <div className="gold-rule mb-6" />
      <h1 className="text-4xl font-bold mb-2"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
        1-on-1 Sessions
      </h1>
      <p className="mb-8" style={{ color: "var(--color-muted)" }}>
        Book live video coaching with an experienced delegate.
      </p>

      {/* Progress */}
      <div className="flex gap-1 mb-10">
        {steps.map((s) => (
          <div key={s} className="flex-1 h-1.5 rounded-full transition-all"
            style={{ background: s <= step ? "var(--color-accent)" : "var(--color-border-strong)" }} />
        ))}
      </div>

      {/* Step 1: Topic */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--color-ink)" }}>
            What do you want to work on?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COACHING_TOPICS.map((t) => (
              <button
                key={t.title}
                onClick={() => { setSelectedTopic(t.title); setStep(2); }}
                className="card text-left transition-all"
                style={{
                  cursor: "pointer",
                  border: selectedTopic === t.title ? "2px solid var(--color-accent)" : undefined,
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium" style={{ color: "var(--color-ink)" }}>
                    {t.title}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full ml-2"
                    style={{ background: "var(--color-surface)", color: "var(--color-muted)" }}>
                    {t.duration}
                  </span>
                </div>
                <p className="text-sm" style={{ color: "var(--color-muted)" }}>{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Coach */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--color-ink)" }}>
            Choose a coach
          </h2>
          <div className="max-w-md mb-6">
            {COACHES.map((c) => (
              <button
                key={c.name}
                onClick={() => { setSelectedCoach(c.name); setStep(3); }}
                className="card text-left transition-all"
                style={{
                  cursor: "pointer",
                  border: selectedCoach === c.name ? "2px solid var(--color-accent)" : undefined,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}>
                    {initials(c.name)}
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{ color: "var(--color-ink)" }}>
                      {c.name}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-muted)" }}>{c.role}</div>
                  </div>
                </div>
                <p className="text-xs mb-3" style={{ color: "var(--color-muted)" }}>{c.bio}</p>
                <div className="flex flex-wrap gap-1">
                  {c.specialties.map((s) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "var(--color-surface)", color: "var(--color-muted)" }}>
                      {s}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="btn btn-secondary">Back</button>
        </div>
      )}

      {/* Step 3: Date */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--color-ink)" }}>
            Pick a date
          </h2>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-6">
            {days.map((d) => (
              <button
                key={d}
                onClick={() => { setSelectedDate(d); setStep(4); }}
                className="py-3 px-2 rounded-lg text-xs text-center border transition"
                style={{
                  background: selectedDate === d ? "var(--color-ink)" : "var(--color-card)",
                  color: selectedDate === d ? "var(--color-paper)" : "var(--color-ink)",
                  borderColor: selectedDate === d ? "var(--color-ink)" : "var(--color-border-strong)",
                  cursor: "pointer",
                }}
              >
                {d.split(", ").map((part, i) => (
                  <span key={i} className={`block ${i === 0 ? "font-medium" : ""}`}>{part}</span>
                ))}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(2)} className="btn btn-secondary">Back</button>
        </div>
      )}

      {/* Step 4: Time */}
      {step === 4 && (
        <div>
          <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--color-ink)" }}>
            Pick a time
          </h2>
          <div className="grid grid-cols-5 gap-3 mb-6">
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                onClick={() => { setSelectedTime(t); setStep(5); }}
                className="py-3 rounded-lg border text-sm font-medium transition"
                style={{
                  background: selectedTime === t ? "var(--color-ink)" : "var(--color-card)",
                  color: selectedTime === t ? "var(--color-paper)" : "var(--color-ink)",
                  borderColor: selectedTime === t ? "var(--color-ink)" : "var(--color-border-strong)",
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(3)} className="btn btn-secondary">Back</button>
        </div>
      )}

      {/* Step 5: Contact */}
      {step === 5 && (
        <div>
          <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--color-ink)" }}>
            Your details
          </h2>
          <div className="max-w-lg space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-ink)" }}>
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm"
                style={{ borderColor: "var(--color-border-strong)", background: "var(--color-card)", color: "var(--color-ink)" }}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-ink)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm"
                style={{ borderColor: "var(--color-border-strong)", background: "var(--color-card)", color: "var(--color-ink)" }}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-ink)" }}>
                Notes <span style={{ color: "var(--color-muted)" }}>(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border text-sm resize-y"
                style={{ borderColor: "var(--color-border-strong)", background: "var(--color-card)", color: "var(--color-ink)" }}
                placeholder="Anything you want the coach to know beforehand..."
              />
            </div>
          </div>
          <button onClick={() => setStep(4)} className="btn btn-secondary">Back</button>
        </div>
      )}

      {/* Sticky summary bar */}
      {step > 1 && (
        <div
          className="fixed bottom-0 left-0 right-0 px-5 py-3 flex items-center justify-between gap-4 z-40"
          style={{
            background: "var(--color-card)",
            borderTop: "1px solid var(--color-border-strong)",
          }}
        >
          <div className="text-sm flex flex-wrap gap-x-4 gap-y-1" style={{ color: "var(--color-muted)" }}>
            {selectedTopic && <span><strong style={{ color: "var(--color-ink)" }}>{selectedTopic}</strong></span>}
            {selectedCoach && <span>with {selectedCoach}</span>}
            {selectedDate && <span>{selectedDate}</span>}
            {selectedTime && <span>at {selectedTime}</span>}
          </div>
          <button
            onClick={confirm}
            disabled={!canConfirm || loading}
            className="btn btn-primary flex-shrink-0"
            style={{ background: canConfirm ? "var(--color-ink)" : undefined, opacity: canConfirm ? 1 : 0.4 }}
          >
            {loading ? "Booking…" : "Confirm booking →"}
          </button>
        </div>
      )}
      {/* Padding so sticky bar doesn't cover content */}
      {step > 1 && <div className="h-20" />}
    </div>
  );
}
