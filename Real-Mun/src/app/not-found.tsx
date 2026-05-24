import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-5">
      <div className="gold-rule mx-auto mb-6" />
      <h1
        className="text-6xl font-bold mb-4"
        style={{ color: "var(--color-ink)" }}
      >
        404
      </h1>
      <p className="text-xl mb-2" style={{ color: "var(--color-ink)" }}>
        Page not found
      </p>
      <p className="mb-8" style={{ color: "var(--color-muted)" }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/" className="btn btn-primary">
        Back to home
      </Link>
    </div>
  );
}
