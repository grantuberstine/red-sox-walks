"use client";

import { WooSoxLogo } from "./WooSoxLogo";
import type { Theme } from "@/lib/theme";

export type Section =
  | "walks"
  | "strikeouts"
  | "players"
  | "team"
  | "analytics"
  | "fund";

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
    description: "Free passes by category",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="1.5" />
        <path d="m9 20 3-6 3 6" />
        <path d="m6 8 6 2 6-2" />
        <path d="M12 10v4" />
      </svg>
    ),
  },
  {
    key: "strikeouts",
    label: "Strikeouts",
    short: "Ks",
    description: "Punchouts & 3-up-3-down",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
      </svg>
    ),
  },
  {
    key: "players",
    label: "Players",
    short: "Players",
    description: "Profiles & gallery",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: "team",
    label: "Team",
    short: "Team",
    description: "Record & game log",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
  {
    key: "analytics",
    label: "Analytics",
    short: "Analytics",
    description: "Velocity & pitch mix",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 4 4 5-5" />
      </svg>
    ),
  },
  {
    key: "fund",
    label: "No Pass Fund",
    short: "Fund",
    description: "Walk fees & K bonus",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
        <path d="M12 18V6" />
      </svg>
    ),
  },
];

function RosterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 9h10M7 13h10M7 17h6" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export function Sidebar({
  section,
  onSectionChange,
  onOpenRoster,
  theme,
  onToggleTheme,
}: {
  section: Section;
  onSectionChange: (s: Section) => void;
  onOpenRoster: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const isDark = theme === "dark";
  return (
    <aside className="hidden h-screen flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:sticky lg:top-0 lg:flex lg:w-[220px] lg:shrink-0 xl:w-[240px]">
      <div className="flex h-[73px] items-center gap-2.5 border-b border-[var(--border)] px-4">
        <WooSoxLogo size={36} />
        <div className="min-w-0">
          <div className="truncate text-sm font-bold leading-tight text-[var(--text)]">
            WooSox
          </div>
          <div className="text-[11px] leading-tight text-[var(--text-muted)]">
            Tracker
          </div>
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
                  ? "bg-[var(--color-sox-red)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
              }`}
            >
              <span className={active ? "text-white" : ""}>
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

      <div className="space-y-1.5 border-t border-[var(--border)] px-3 py-3">
        <SidebarFooterButton
          icon={<RosterIcon />}
          label="Roster"
          onClick={onOpenRoster}
        />
        <SidebarFooterButton
          icon={isDark ? <SunIcon /> : <MoonIcon />}
          label={isDark ? "Light mode" : "Dark mode"}
          onClick={onToggleTheme}
        />
      </div>
    </aside>
  );
}

function SidebarFooterButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-[11px] font-semibold text-[var(--text)] transition hover:border-[var(--border-strong)]"
    >
      {icon}
      {label}
    </button>
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
      className="sticky bottom-0 z-30 grid grid-cols-6 border-t border-[var(--border)] bg-[var(--surface)] shadow-[0_-2px_8px_rgba(12,35,64,0.05)] lg:hidden"
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
