import { getSession } from "@/lib/auth";
import WorkerTabs from "@/components/worker/WorkerTabs";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      {/* Worker header */}
      <div className="mb-6">
        <div className="text-xs font-mono uppercase tracking-widest mb-1"
          style={{ color: "var(--color-muted)" }}>
          Worker Dashboard
        </div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
          Welcome back, {session?.username ?? "worker"}
        </h1>
      </div>

      <WorkerTabs />

      {children}
    </div>
  );
}
