import { counts, listPapers, listSessions, listBookings } from "@/lib/store";

export const dynamic = "force-dynamic";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type KindType = "P" | "S" | "B";

function KindBadge({ kind }: { kind: KindType }) {
  const colors: Record<KindType, { bg: string; color: string }> = {
    P: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
    S: { bg: "rgba(34,197,94,0.15)", color: "#16a34a" },
    B: { bg: "rgba(234,179,8,0.15)", color: "#ca8a04" },
  };
  const c = colors[kind];
  return (
    <span
      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: c.bg, color: c.color }}
    >
      {kind}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card text-center">
      <div className="text-3xl font-bold mb-1"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
        {value}
      </div>
      <div className="text-sm" style={{ color: "var(--color-muted)" }}>
        {label}
      </div>
    </div>
  );
}

export default function WorkerOverviewPage() {
  const c = counts();
  const papers = listPapers();
  const sessions = listSessions();
  const bookings = listBookings();

  type ActivityItem = {
    kind: KindType;
    who: string;
    what: string;
    detail: string;
    createdAt: number;
  };

  const activity: ActivityItem[] = [
    ...papers.map((p) => ({
      kind: "P" as KindType,
      who: p.username,
      what: `${p.committee} · ${p.country}`,
      detail: p.topic,
      createdAt: p.createdAt,
    })),
    ...sessions.map((s) => ({
      kind: "S" as KindType,
      who: s.username,
      what: `${s.committee} · ${s.userCountry}`,
      detail: s.topic,
      createdAt: s.createdAt,
    })),
    ...bookings.map((b) => ({
      kind: "B" as KindType,
      who: b.username,
      what: `${b.coach} · ${b.topic}`,
      detail: `${b.date} at ${b.time}`,
      createdAt: b.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <Stat label="Position Papers" value={c.papers} />
        <Stat label="Mock Sessions" value={c.sessions} />
        <Stat label="1-on-1 Bookings" value={c.bookings} />
      </div>

      <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-ink)" }}>
        Recent activity
      </h2>
      {activity.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>No activity yet.</p>
      ) : (
        <div className="card divide-y" style={{ borderColor: "var(--color-border)" }}>
          {activity.map((a, i) => (
            <div key={i} className="flex items-center gap-4 py-3 text-sm">
              <KindBadge kind={a.kind} />
              <div className="flex-1 min-w-0">
                <span className="font-medium" style={{ color: "var(--color-ink)" }}>
                  {a.who}
                </span>
                <span className="mx-2" style={{ color: "var(--color-muted)" }}>·</span>
                <span style={{ color: "var(--color-ink)" }}>{a.what}</span>
                <div className="text-xs truncate" style={{ color: "var(--color-muted)" }}>
                  {a.detail}
                </div>
              </div>
              <div className="text-xs flex-shrink-0" style={{ color: "var(--color-muted)" }}>
                {timeAgo(a.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
