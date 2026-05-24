"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/worker", label: "Overview" },
  { href: "/worker/papers", label: "Papers" },
  { href: "/worker/sessions", label: "Mock Sessions" },
  { href: "/worker/bookings", label: "Bookings" },
];

export default function WorkerTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 mb-8 border-b" style={{ borderColor: "var(--color-border)" }}>
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className="px-4 py-2 text-sm font-medium transition -mb-px border-b-2"
            style={{
              color: active ? "var(--color-ink)" : "var(--color-muted)",
              borderBottomColor: active ? "var(--color-accent)" : "transparent",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
