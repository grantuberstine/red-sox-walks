"use client";

import type { Theme } from "@/lib/theme";

export function ThemeToggle({
  theme,
  onToggle,
  compact = false,
}: {
  theme: Theme;
  onToggle: () => void;
  compact?: boolean;
}) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`${isDark ? "Light" : "Dark"} mode`}
      className={`inline-flex cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)] ${
        compact ? "h-9 w-9" : "min-h-[36px] gap-1.5 px-2.5 text-[11px] font-semibold"
      }`}
    >
      {isDark ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {!compact && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
