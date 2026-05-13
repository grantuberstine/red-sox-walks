"use client";

export type ViewMode = "table" | "cards";

export function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] p-0.5 text-[11px]">
      <button
        type="button"
        onClick={() => onChange("table")}
        className={`flex min-h-[32px] cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition ${
          value === "table"
            ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
            : "text-[var(--text-muted)] hover:text-[var(--text)]"
        }`}
        aria-pressed={value === "table"}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 6h18M3 12h18M3 18h18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        Table
      </button>
      <button
        type="button"
        onClick={() => onChange("cards")}
        className={`flex min-h-[32px] cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition ${
          value === "cards"
            ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
            : "text-[var(--text-muted)] hover:text-[var(--text)]"
        }`}
        aria-pressed={value === "cards"}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
        </svg>
        Cards
      </button>
    </div>
  );
}
