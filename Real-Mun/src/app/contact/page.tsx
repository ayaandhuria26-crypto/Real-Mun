import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Contact — Real-MUN",
  description:
    "Reach Ayaan Dhuria and the Real-MUN team. Email or phone — we respond within 24 hours.",
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-16">
      <div className="gold-rule mb-6" />
      <h1
        className="text-4xl font-bold mb-4"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
      >
        Contact
      </h1>
      <p className="mb-10" style={{ color: "var(--color-muted)" }}>
        Questions about Real-MUN, club packages, or coaching? We typically respond
        within 24 hours.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="card">
          <div className="text-xs font-mono uppercase tracking-widest mb-3"
            style={{ color: "var(--color-muted)" }}>
            EMAIL
          </div>
          <a
            href={`mailto:${CONTACT.email}`}
            className="text-xl font-semibold hover:underline"
            style={{ color: "var(--color-accent)" }}
          >
            {CONTACT.email}
          </a>
        </div>
        <div className="card">
          <div className="text-xs font-mono uppercase tracking-widest mb-3"
            style={{ color: "var(--color-muted)" }}>
            PHONE
          </div>
          <a
            href={`tel:${CONTACT.phone}`}
            className="text-xl font-semibold hover:underline"
            style={{ color: "var(--color-ink)" }}
          >
            {CONTACT.phone}
          </a>
        </div>
      </div>

      <div
        className="rounded-2xl px-8 py-8 text-center"
        style={{ background: "var(--color-ink)" }}
      >
        <h2
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-paper)" }}
        >
          Want a 1-on-1 session instead?
        </h2>
        <p className="mb-6" style={{ color: "rgba(245,243,237,0.7)" }}>
          Book a live coaching session with Ayaan Dhuria or one of our experienced coaches.
        </p>
        <Link
          href="/sessions"
          className="btn"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          Book a session →
        </Link>
      </div>
    </div>
  );
}
