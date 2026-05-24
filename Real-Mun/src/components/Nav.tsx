"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setSession(d.session ?? null))
      .catch(() => setSession(null));
  }, [pathname]);

  async function signOut() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    setSession(null);
    router.push("/");
    router.refresh();
  }

  const links = [
    { href: "/learn", label: "Learn" },
    { href: "/position-paper", label: "Position Paper" },
    { href: "/sessions", label: "1-on-1 Sessions" },
    { href: "/conference", label: "Mock Conference" },
  ];

  return (
    <nav
      className="sticky top-0 z-40 border-b"
      style={{
        background: "var(--color-paper)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="brand-icon w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-ink)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L9.5 6.5H14L10.5 9L12 13.5L8 11L4 13.5L5.5 9L2 6.5H6.5L8 2Z"
                fill="#d4a017" />
            </svg>
          </div>
          <span
            className="font-bold text-lg brand-mark"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Real · MUN
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="nav-link px-3 py-1.5 text-sm font-medium transition"
              style={{ color: pathname === l.href ? "var(--color-ink)" : "var(--color-muted)" }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {session ? (
            <div className="hidden md:flex items-center gap-3">
              {session.role === "worker" && (
                <Link
                  href="/worker"
                  className="text-sm font-medium"
                  style={{ color: "var(--color-accent)" }}
                >
                  Worker Dashboard
                </Link>
              )}
              <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                {session.username} · {session.role}
              </span>
              <button
                onClick={signOut}
                className="btn text-xs px-3 py-1.5"
                style={{
                  background: "var(--color-surface)",
                  color: "var(--color-ink)",
                  border: "1px solid var(--color-border-strong)",
                  borderRadius: "6px",
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/sign-in" className="hidden md:inline-flex btn btn-primary text-sm px-4 py-2">
              Sign in
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className="w-5 h-0.5 transition-all"
              style={{ background: "var(--color-ink)" }} />
            <span className="w-5 h-0.5 transition-all"
              style={{ background: "var(--color-ink)" }} />
            <span className="w-5 h-0.5 transition-all"
              style={{ background: "var(--color-ink)" }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t px-5 py-4 space-y-2"
          style={{ borderColor: "var(--color-border)", background: "var(--color-paper)" }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-2 text-sm font-medium"
              style={{ color: "var(--color-ink)" }}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          {session ? (
            <>
              {session.role === "worker" && (
                <Link href="/worker" className="block py-2 text-sm font-medium"
                  style={{ color: "var(--color-accent)" }}
                  onClick={() => setMenuOpen(false)}>
                  Worker Dashboard
                </Link>
              )}
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="py-2 text-sm"
                style={{ color: "var(--color-muted)" }}
              >
                Sign out ({session.username})
              </button>
            </>
          ) : (
            <Link href="/sign-in" className="block py-2 text-sm font-medium"
              style={{ color: "var(--color-ink)" }}
              onClick={() => setMenuOpen(false)}>
              Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
