import type { Metadata } from "next";
import Link from "next/link";
import { learnSections } from "@/lib/learn-content";

export const metadata: Metadata = {
  title: "Learn the Basics — Real-MUN",
  description:
    "Parliamentary procedure, MUN vocabulary, speaking tips, position paper structure, bloc strategy, and rookie traps — written for first-time and returning delegates.",
};

export default function LearnPage() {
  return (
    <div style={{ background: "var(--color-paper)" }}>
      {/* Hero — full ink background */}
      <div style={{ background: "var(--color-ink)" }}>
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-14">
          {/* Animated gold bar */}
          <div className="gold-bar-animate mb-7" style={{ height: "2px", borderRadius: "2px" }} />

          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest mb-3"
                style={{ color: "var(--color-accent)" }}>
                Delegate Handbook
              </p>
              <h1
                className="text-5xl md:text-6xl font-bold mb-4 leading-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-paper)" }}
              >
                Learn the Basics
              </h1>
              <p className="text-base max-w-lg leading-relaxed"
                style={{ color: "rgba(245,243,237,0.6)" }}>
                Six chapters. Everything a delegate needs — procedure, speeches,
                papers, and coalition strategy.
              </p>
            </div>
            <div className="text-right">
              <div className="gold-shimmer text-4xl font-bold font-mono leading-none mb-1">06</div>
              <div className="text-xs uppercase tracking-widest" style={{ color: "rgba(245,243,237,0.4)" }}>
                chapters · ~15 min
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-14">
        <div className="flex gap-12 items-start">

          {/* Sticky sidebar TOC — desktop only */}
          <aside className="hidden lg:block w-52 flex-shrink-0 sticky top-20 self-start">
            <div className="text-xs font-mono uppercase tracking-widest mb-5"
              style={{ color: "var(--color-accent)" }}>
              Contents
            </div>
            <nav className="space-y-0.5">
              {learnSections.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg text-sm transition group"
                  style={{ color: "var(--color-muted)" }}
                >
                  <span className="text-xs font-mono font-bold w-5 flex-shrink-0"
                    style={{ color: "var(--color-accent)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="group-hover:text-[var(--color-ink)] transition leading-tight">
                    {s.title}
                  </span>
                </a>
              ))}
            </nav>

            <div className="mt-8 pt-6 space-y-2"
              style={{ borderTop: "1px solid var(--color-border-strong)" }}>
              <div className="text-xs font-mono uppercase tracking-widest mb-3"
                style={{ color: "var(--color-accent)" }}>
                Practice now
              </div>
              <Link href="/conference"
                className="flex items-center justify-between text-sm px-3 py-2.5 rounded-lg font-medium transition"
                style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}>
                <span>Mock Conference</span>
                <span style={{ color: "var(--color-accent)" }}>→</span>
              </Link>
              <Link href="/position-paper"
                className="flex items-center justify-between text-sm px-3 py-2.5 rounded-lg font-medium transition"
                style={{ border: "1px solid var(--color-border-strong)", color: "var(--color-ink)" }}>
                <span>Grade my paper</span>
                <span style={{ color: "var(--color-accent)" }}>→</span>
              </Link>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-16">
            {/* Mobile TOC */}
            <div className="lg:hidden rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--color-border-strong)" }}>
              <div className="px-5 py-3" style={{ background: "var(--color-ink)" }}>
                <span className="text-xs font-mono uppercase tracking-widest"
                  style={{ color: "var(--color-accent)" }}>
                  Contents
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {learnSections.map((s, i) => (
                  <a key={s.id} href={`#${s.id}`}
                    className="flex items-center gap-3 py-3 px-4 text-sm border-b transition"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-ink)" }}>
                    <span className="text-xs font-mono font-bold w-5 flex-shrink-0"
                      style={{ color: "var(--color-accent)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{s.title}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Sections */}
            {learnSections.map((s, i) => (
              <section key={s.id} id={s.id}>
                {/* Chapter header */}
                <div className="rounded-2xl overflow-hidden mb-6"
                  style={{ border: "1px solid var(--color-border-strong)" }}>
                  {/* Dark header bar */}
                  <div className="px-6 py-5" style={{ background: "var(--color-ink)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="gold-shimmer text-base font-mono font-bold">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-xs font-mono uppercase tracking-widest"
                        style={{ color: "rgba(245,243,237,0.4)" }}>
                        Chapter {i + 1}
                      </span>
                    </div>
                    <h2
                      className="text-2xl md:text-3xl font-bold"
                      style={{ fontFamily: "var(--font-display)", color: "var(--color-paper)" }}
                    >
                      {s.title}
                    </h2>
                  </div>
                  {/* Animated gold rule */}
                  <div className="gold-bar-animate" style={{ height: "2px" }} />
                  {/* Blurb */}
                  <div className="px-6 py-4"
                    style={{ background: "rgba(184,134,11,0.04)", borderTop: "none" }}>
                    <p className="text-sm leading-relaxed max-w-2xl"
                      style={{ color: "var(--color-muted)" }}>
                      {s.blurb}
                    </p>
                  </div>
                </div>

                {/* Items grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {s.items.map((item, itemIdx) => (
                    <div key={item.term}
                      className="rounded-xl p-5 flex flex-col gap-2.5"
                      style={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                      }}>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-base leading-snug"
                          style={{ color: "var(--color-ink)" }}>
                          {item.term}
                        </h3>
                        <span className="text-xs font-mono font-bold flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded"
                          style={{
                            color: "var(--color-accent)",
                            background: "rgba(184,134,11,0.08)",
                          }}>
                          {String(itemIdx + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                        {item.def}
                      </p>
                      {item.example && (
                        <div className="mt-1 rounded-lg px-4 py-3 text-sm font-mono"
                          style={{
                            background: "rgba(184,134,11,0.06)",
                            borderLeft: "3px solid var(--color-accent)",
                            color: "var(--color-ink)",
                          }}>
                          {item.example}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="py-16 px-5" style={{ background: "var(--color-ink)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="gold-bar-animate mx-auto mb-8"
            style={{ height: "1px", maxWidth: "200px" }} />
          <div className="text-xs font-mono uppercase tracking-widest mb-4"
            style={{ color: "var(--color-accent)" }}>
            Now you know the theory
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-paper)" }}>
            Time to practice
          </h2>
          <p className="mb-8 max-w-lg mx-auto"
            style={{ color: "rgba(245,243,237,0.55)" }}>
            Put your new knowledge to work in a real 30-minute committee, or get
            your position paper graded against all five rubric dimensions.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/conference" className="btn btn-primary"
              style={{ background: "var(--color-accent)", color: "var(--color-ink)", fontWeight: 700 }}>
              Start a Mock Conference
            </Link>
            <Link href="/position-paper" className="btn btn-secondary"
              style={{ borderColor: "rgba(245,243,237,0.2)", color: "var(--color-paper)" }}>
              Grade my position paper
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
