import Link from "next/link";

export const CONTACT = {
  email: "ayaandhuria26@gmail.com",
  phone: "804-297-1800",
  instagram: "https://instagram.com/realmun",
  twitter: "https://twitter.com/realmun",
  linkedin: "https://linkedin.com/company/realmun",
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t mt-auto"
      style={{ borderColor: "var(--color-border)", background: "var(--color-paper)" }}
    >
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div
              className="text-xl font-bold mb-3"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
            >
              Real · MUN
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
              AI training for Model UN delegates. Built by a delegate, for delegates.
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              <a
                href={CONTACT.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                style={{ color: "var(--color-muted)" }}
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href={CONTACT.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X / Twitter"
                style={{ color: "var(--color-muted)" }}
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href={CONTACT.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                style={{ color: "var(--color-muted)" }}
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href={`mailto:${CONTACT.email}`}
                aria-label="Email"
                style={{ color: "var(--color-muted)" }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--color-muted)" }}
            >
              Contact
            </div>
            <div className="space-y-2">
              <a
                href={`mailto:${CONTACT.email}`}
                className="block text-sm hover:underline"
                style={{ color: "var(--color-ink)" }}
              >
                {CONTACT.email}
              </a>
              <a
                href={`tel:${CONTACT.phone}`}
                className="block text-sm hover:underline"
                style={{ color: "var(--color-ink)" }}
              >
                {CONTACT.phone}
              </a>
            </div>
          </div>

          {/* Train */}
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--color-muted)" }}
            >
              Train
            </div>
            <div className="space-y-2">
              {[
                { href: "/learn", label: "Learn the Basics" },
                { href: "/position-paper", label: "Position Paper Feedback" },
                { href: "/sessions", label: "1-on-1 Sessions" },
                { href: "/conference", label: "Mock Conference" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block text-sm hover:underline"
                  style={{ color: "var(--color-ink)" }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* More */}
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--color-muted)" }}
            >
              More
            </div>
            <div className="space-y-2">
              {[
                { href: "/contact", label: "Contact" },
                { href: "/sign-in", label: "Sign in" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block text-sm hover:underline"
                  style={{ color: "var(--color-ink)" }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div
          className="pt-6 flex flex-col md:flex-row justify-between items-center gap-2"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <p className="text-xs" style={{ color: "var(--color-muted)" }}>
            © {year} Real-MUN. Built by Ayaan Dhuria.
          </p>
          <p className="text-xs" style={{ color: "var(--color-muted)" }}>
            Free during early access.
          </p>
        </div>
      </div>
    </footer>
  );
}
