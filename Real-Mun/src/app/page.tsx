import Link from "next/link";

const sections = [
  {
    href: "/learn",
    num: "01",
    title: "Learn the Basics",
    desc: "Parliamentary procedure, MUN vocabulary, and beginner tips — written for people who have never raised a placard before.",
    cta: "Start learning",
  },
  {
    href: "/position-paper",
    num: "02",
    title: "Position Paper Feedback",
    desc: "Pick your committee, country, and topic. Paste your draft. Get structured, line-by-line AI feedback in under a minute.",
    cta: "Get feedback",
  },
  {
    href: "/sessions",
    num: "03",
    title: "1-on-1 Sessions",
    desc: "Book a live session with an experienced delegate for speech coaching, resolution writing, or crisis prep.",
    cta: "Book a session",
  },
  {
    href: "/conference",
    num: "04",
    title: "Mock Conference",
    desc: "30 minutes. A Chair, three AI delegates, and you. Raise your placard, give a speech, get scored on delivery and content.",
    cta: "Enter the chamber",
  },
];

const stats = [
  { value: "11", label: "Procedural phases", sub: "Simulated end to end" },
  { value: "5", label: "Scoring dimensions", sub: "On every paper" },
  { value: "< 60s", label: "Paper feedback", sub: "From upload to verdict" },
  { value: "$0", label: "Early access", sub: "No card, no trial" },
];

const learnPoints = [
  {
    title: "Parliamentary procedure",
    desc: "Speakers' lists, moderated and unmoderated caucuses, motions, yields, and voting — what each is and when to use it.",
  },
  {
    title: "Diplomatic language",
    desc: "Third-person framing, the rhetoric Chairs reward, and the rookie traps that get noticed within five minutes.",
  },
  {
    title: "Building coalitions",
    desc: "How to walk into unmoderated caucus, find your bloc, and end up as a main submitter on the passing resolution.",
  },
  {
    title: "Crisis instincts",
    desc: "Reacting to crisis updates under time pressure, writing tight crisis notes, and building a backroom arc that lands.",
  },
];

const testimonials = [
  {
    quote:
      "I walked into my first conference already knowing how moderated caucuses flowed. The mock sessions made the actual chamber feel familiar.",
    name: "First-time delegate",
    role: "Novice committee, regional MUN",
  },
  {
    quote:
      "The AI feedback caught a policy red flag in my position paper that my coach missed. Saved me from making the wrong argument on day one.",
    name: "Returning delegate",
    role: "ECOSOC, school-circuit MUN",
  },
  {
    quote:
      "Better than any prep doc I've used. The unmoderated caucus simulation taught me how to actually trade clause language with other delegations.",
    name: "Head delegate",
    role: "Specialized agency, college MUN",
  },
];

const faqs = [
  {
    q: "Is Real-MUN really free?",
    a: "Yes — every feature is free during early access. We use generous free tiers from Google Gemini, Groq, Cerebras, and Microsoft Edge TTS for AI, voice, and speech recognition. Sign in with any email and try everything.",
  },
  {
    q: "Do I need a microphone to use the mock conference?",
    a: "No. You can type your speeches instead. The microphone option is there if you want to practice your actual delivery — your browser's built-in speech recognition transcribes you live with no extra setup.",
  },
  {
    q: "How realistic are the AI delegates?",
    a: "Each delegate has a fixed country, a personality (diplomatic, aggressive, coalition-builder, etc.), and a system prompt that grounds them in that country's real foreign policy. They reference each other's speeches across the session, cite real treaty articles, and stay in character throughout.",
  },
  {
    q: "Will the feedback help me at an actual MUN conference?",
    a: "It's designed by experienced delegates around five dimensions Chairs actually score: research depth, policy alignment, structure, persuasiveness, and diplomatic language. Use it to tighten papers before your conference and to rehearse the floor experience.",
  },
  {
    q: "Can my club or school use this?",
    a: "Yes. Reach out — we offer club packages with group dashboards, custom committees, and training sessions for new delegates.",
  },
];

const howItWorks = [
  {
    title: "The Chair",
    desc: "A neutral AI moderator who runs procedural phases, calls on delegates, manages time, and keeps things moving. Speaks with Edge TTS voice for realism.",
  },
  {
    title: "Three AI delegates",
    desc: "Each has a country, a persona (diplomatic, aggressive, coalition-builder, technical, or quiet), and a system prompt grounded in real foreign policy.",
  },
  {
    title: "You",
    desc: "You represent a country of your choice. Raise your placard, submit motions, give speeches, and build coalitions — just like a real committee.",
  },
  {
    title: "The overseer",
    desc: "A quality layer that trims delegate speeches for length, strips off-character output, and keeps every turn sounding like a real MUN committee.",
  },
];

export default function HomePage() {
  return (
    <div style={{ background: "var(--color-paper)" }}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 10% 0%, rgba(184,134,11,0.07) 0%, transparent 60%), radial-gradient(ellipse at 90% 100%, rgba(212,160,23,0.06) 0%, transparent 60%)",
          }}
        />
        <div className="max-w-6xl mx-auto px-5 py-24 md:py-32 relative">
          <div className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border mb-8"
            style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}>
            Free during launch
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 max-w-4xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
            Walk into your next MUN{" "}
            <span style={{ color: "var(--color-accent)" }}>already knowing</span>{" "}
            how it'll feel.
          </h1>
          <p className="text-xl mb-10 max-w-2xl" style={{ color: "var(--color-muted)" }}>
            AI-graded position papers, 1-on-1 coaching, and full 30-minute mock
            conferences with AI delegates.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/conference" className="btn btn-primary text-base px-7 py-3">
              Try a Mock Conference
            </Link>
            <Link href="/learn" className="btn btn-secondary text-base px-7 py-3">
              I'm new — start here
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <div className="card">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-bold mb-1"
                  style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
                  {s.value}
                </div>
                <div className="font-medium text-sm" style={{ color: "var(--color-ink)" }}>
                  {s.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sections grid */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((s) => (
            <Link key={s.href} href={s.href} className="card group block no-underline">
              <div className="flex-1">
                <div className="text-2xl font-mono font-bold mb-3 gold-shimmer">
                  {s.num}
                </div>
                <h2 className="text-xl font-semibold mb-2 hover-glow"
                  style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
                  {s.title}
                </h2>
                <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
                  {s.desc}
                </p>
                <span className="text-sm font-medium" style={{ color: "var(--color-accent)" }}>
                  {s.cta} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Dark band — What you'll learn */}
      <section
        className="py-20 px-5"
        style={{ background: "var(--color-ink)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="gold-rule mb-6" />
          <h2 className="text-3xl font-bold mb-12"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-paper)" }}>
            What you'll actually learn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {learnPoints.map((p) => (
              <div key={p.title}>
                <h3 className="font-semibold mb-2" style={{ color: "var(--color-paper)" }}>
                  {p.title}
                </h3>
                <p className="text-sm" style={{ color: "rgba(245,243,237,0.6)" }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Real-MUN works */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="gold-rule mb-6" />
        <h2 className="text-3xl font-bold mb-12"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
          How Real-MUN works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {howItWorks.map((h, i) => (
            <div key={h.title} className="card">
              <div className="text-xs font-mono mb-3" style={{ color: "var(--color-muted)" }}>
                0{i + 1}
              </div>
              <h3 className="font-semibold mb-2"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
                {h.title}
              </h3>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                {h.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="gold-rule mb-6" />
        <h2 className="text-3xl font-bold mb-12"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
          From delegates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="card flex flex-col gap-4">
              <p className="text-sm flex-1" style={{ color: "var(--color-ink)" }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <div className="font-medium text-sm" style={{ color: "var(--color-ink)" }}>
                  {t.name}
                </div>
                <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {t.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Founder dark band */}
      <section className="py-20 px-5" style={{ background: "var(--color-ink)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-xs font-mono uppercase tracking-widest mb-4"
            style={{ color: "var(--color-accent)" }}>
            BUILT BY A DELEGATE, FOR DELEGATES
          </div>
          <h2 className="text-3xl font-bold mb-6"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-paper)" }}>
            Real-MUN exists because cold-walking into a conference is brutal.
          </h2>
          <p className="mb-4" style={{ color: "rgba(245,243,237,0.75)" }}>
            <strong style={{ color: "var(--color-paper)" }}>Ayaan Dhuria</strong> founded
            Real-MUN after two years on the circuit — three competitive conferences, one Best
            Delegate, one Honorable Mention. He noticed new delegates were spending hundreds
            on prep books and coaching packages that didn't actually rehearse the chamber
            experience.
          </p>
          <p style={{ color: "rgba(245,243,237,0.75)" }}>
            Real-MUN is built around what actually works: a feedback rubric grounded in what
            Chairs score, mock sessions modeled on real committee procedure, and the kind of
            in-room coaching that usually only comes from older delegates in your club.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-5 py-20">
        <div className="gold-rule mb-6" />
        <h2 className="text-3xl font-bold mb-12"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
          Frequently asked
        </h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="card"
              style={{ cursor: "pointer" }}
            >
              <summary
                className="font-medium text-base cursor-pointer list-none flex justify-between items-center"
                style={{ color: "var(--color-ink)" }}
              >
                {f.q}
                <span style={{ color: "var(--color-muted)" }}>+</span>
              </summary>
              <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA dark block */}
      <section className="py-20 px-5" style={{ background: "var(--color-ink)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-paper)" }}>
            Your next conference is closer than you think.
          </h2>
          <p className="mb-8 text-lg" style={{ color: "rgba(245,243,237,0.7)" }}>
            Start with a mock conference or drop your paper for instant feedback.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/conference"
              className="btn"
              style={{
                background: "var(--color-accent)",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              Try a Mock Conference
            </Link>
            <a
              href="mailto:ayaandhuria26@gmail.com"
              className="btn btn-secondary"
              style={{ borderColor: "rgba(245,243,237,0.3)", color: "var(--color-paper)" }}
            >
              Email ayaandhuria26@gmail.com
            </a>
            <a
              href="tel:804-297-1800"
              className="btn btn-secondary"
              style={{ borderColor: "rgba(245,243,237,0.3)", color: "var(--color-paper)" }}
            >
              Call 804-297-1800
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
