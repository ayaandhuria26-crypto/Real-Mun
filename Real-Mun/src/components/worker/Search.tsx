export default function Search({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="px-3 py-2 rounded-lg border text-sm"
      style={{
        borderColor: "var(--color-border-strong)",
        background: "var(--color-card)",
        color: "var(--color-ink)",
        minWidth: "200px",
      }}
    />
  );
}
