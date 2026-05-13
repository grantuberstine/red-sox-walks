"use client";

import { WooSoxLogo } from "./WooSoxLogo";

export type Section = "walks" | "strikeouts" | "players" | "team" | "fund";

const NAV: Array<{
  key: Section;
  label: string;
  short: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    key: "walks",
    label: "Walks",
    short: "Walks",
    description: "Team walk tracker",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 4v6l-3 3v7M15 4v6l3 3v7M12 4v16M9 13h6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "strikeouts",
    label: "Strikeouts",
    short: "Ks",
    description: "Team K tracker",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 5l14 14M19 5L5 19"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "players",
    label: "Players",
    short: "Players",
    description: "Profiles & gallery",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
        <path
          d="M2.5 19c.4-3 3-5 6.5-5s6.1 2 6.5 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="17.5" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M14 18.5c.3-1.7 1.7-3 3.5-3s3.2 1.3 3.5 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "team",
    label: "Team",
    short: "Team",
    description: "Record, log, charts",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 21V8l9-5 9 5v13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    key: "fund",
    label: "No Pass Fund",
    short: "Fund",
    description: "Walk fees · K bonus",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path
          d="M9 9.5c0-1 1-2 3-2s3 1 3 2-1 1.5-3 2-3 1-3 2 1 2 3 2 3-1 3-2M12 6v2M12 16v2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function Sidebar({
  section,
  onSectionChange,
  onOpenRoster,
  hiddenCount,
  totalsLine,
  themeToggle,
}: {
  section: Section;
  onSectionChange: (s: Section) => void;
  onOpenRoster: () => void;
  hiddenCount: number;
  totalsLine: string;
  themeToggle?: React.ReactNode;
}) {
  return (
    <aside className="hidden h-screen flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:sticky lg:top-0 lg:flex lg:w-[220px] lg:shrink-0 xl:w-[240px]">
      <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-4">
        <WooSoxLogo size={36} />
        <div className="min-w-0">
          <div className="truncate text-sm font-bold leading-tight text-[var(--text)]">
            WooSox
          </div>
          <div className="text-[10px] leading-tight text-[var(--text-muted)]">Tracker</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV.map((item) => {
          const active = item.key === section;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSectionChange(item.key)}
              aria-pressed={active}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                active
                  ? "bg-[var(--color-sox-navy)] text-white shadow-sm dark:bg-[var(--color-sox-red)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
              }`}
            >
              <span className={active ? "text-[var(--color-woo-gold)]" : ""}>
                {item.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold">{item.label}</span>
                <span
                  className={`block truncate text-[10px] ${active ? "text-white/70" : "text-[var(--text-muted)]"}`}
                >
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-[var(--border)] px-3 py-3">
        <button
          type="button"
          onClick={onOpenRoster}
          className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]"
        >
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M7 9h10M7 13h10M7 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Roster
          </span>
          {hiddenCount > 0 && (
            <span className="rounded-full bg-[var(--color-sox-red)] px-1.5 text-[10px] font-bold text-white">
              {hiddenCount}
            </span>
          )}
        </button>
        {themeToggle}
        <div className="px-1 text-[10px] leading-tight text-[var(--text-muted)]">
          {totalsLine}
        </div>
      </div>
    </aside>
  );
}

export function MobileTabBar({
  section,
  onSectionChange,
}: {
  section: Section;
  onSectionChange: (s: Section) => void;
}) {
  return (
    <nav
      className="sticky bottom-0 z-30 grid grid-cols-5 border-t border-[var(--border)] bg-[var(--surface)] shadow-[0_-2px_8px_rgba(12,35,64,0.05)] lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV.map((item) => {
        const active = item.key === section;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSectionChange(item.key)}
            aria-pressed={active}
            aria-label={item.label}
            className={`flex min-h-[56px] cursor-pointer flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-semibold transition active:bg-[var(--surface-hover)] ${
              active
                ? "text-[var(--color-sox-red)] dark:text-[var(--color-woo-gold)]"
                : "text-[var(--text-muted)]"
            }`}
          >
            <span
              className={
                active
                  ? "scale-110 transition-transform"
                  : "transition-transform"
              }
            >
              {item.icon}
            </span>
            <span className="leading-none">{item.short}</span>
          </button>
        );
      })}
    </nav>
  );
}
