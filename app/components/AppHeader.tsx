"use client";

export type Section = "players" | "team";

export function AppHeader({
  section,
  onSectionChange,
  walkCount,
  strikeoutCount,
  hiddenCount,
  onOpenRoster,
}: {
  section: Section;
  onSectionChange: (s: Section) => void;
  walkCount: number;
  strikeoutCount: number;
  hiddenCount: number;
  onOpenRoster: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="h-7 w-1.5 rounded-full bg-[var(--color-sox-red)]" />
          <div>
            <div className="text-sm font-bold leading-tight text-[var(--color-sox-navy)]">
              WooSox Tracker
            </div>
            <div className="text-[10px] leading-tight text-slate-500">
              Walks · Strikeouts · {walkCount + strikeoutCount} events
            </div>
          </div>
        </div>

        <nav className="hidden items-center gap-1 sm:flex">
          <SectionTab
            active={section === "players"}
            onClick={() => onSectionChange("players")}
            label="Players"
            icon={<UsersIcon />}
          />
          <SectionTab
            active={section === "team"}
            onClick={() => onSectionChange("team")}
            label="Team"
            icon={<TeamIcon />}
          />
        </nav>

        <button
          type="button"
          onClick={onOpenRoster}
          className="relative inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:text-[var(--color-sox-navy)]"
          title="Manage roster"
        >
          <RosterIcon />
          <span className="hidden sm:inline">Roster</span>
          {hiddenCount > 0 && (
            <span className="rounded-full bg-[var(--color-sox-red)] px-1.5 text-[10px] font-bold text-white">
              {hiddenCount}
            </span>
          )}
        </button>
      </div>

      <nav className="flex items-center justify-center gap-1 border-t border-slate-100 px-4 pb-2 pt-1 sm:hidden">
        <SectionTab
          active={section === "players"}
          onClick={() => onSectionChange("players")}
          label="Players"
          icon={<UsersIcon />}
        />
        <SectionTab
          active={section === "team"}
          onClick={() => onSectionChange("team")}
          label="Team"
          icon={<TeamIcon />}
        />
      </nav>
    </header>
  );
}

function SectionTab({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-[var(--color-sox-navy)] text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-[var(--color-sox-navy)]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
  );
}

function TeamIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 21V8l9-5 9 5v13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function RosterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M7 9h10M7 13h10M7 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
