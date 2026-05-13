"use client";

import { useState } from "react";

export type Mode = "walks" | "strikeouts";

export function TopNav({
  mode,
  onModeChange,
  walkCount,
  strikeoutCount,
  hiddenCount,
  onOpenRoster,
}: {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  walkCount: number;
  strikeoutCount: number;
  hiddenCount: number;
  onOpenRoster: () => void;
}) {
  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="h-7 w-1 rounded-full bg-[var(--color-sox-red)]" />
          <span className="text-sm font-bold text-[var(--color-sox-navy)]">
            WooSox <span className="text-slate-400">|</span> Walks &amp; Ks
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-full bg-slate-100 p-0.5 text-xs">
            <TabButton
              active={mode === "walks"}
              onClick={() => onModeChange("walks")}
              activeColor="bg-[var(--color-sox-red)]"
              label="Walks"
              count={walkCount}
            />
            <TabButton
              active={mode === "strikeouts"}
              onClick={() => onModeChange("strikeouts")}
              activeColor="bg-emerald-600"
              label="Strikeouts"
              count={strikeoutCount}
            />
          </div>
          <button
            type="button"
            onClick={onOpenRoster}
            className="relative inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:text-[var(--color-sox-navy)]"
            title="Manage roster (hide/show pitchers)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
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
            <span className="hidden sm:inline">Roster</span>
            {hiddenCount > 0 && (
              <span className="rounded-full bg-[var(--color-sox-red)] px-1.5 text-[10px] font-bold text-white">
                {hiddenCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

function TabButton({
  active,
  onClick,
  activeColor,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  activeColor: string;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition ${
        active
          ? `${activeColor} text-white shadow-sm`
          : "text-slate-600 hover:text-[var(--color-sox-navy)]"
      }`}
    >
      <span>{label}</span>
      <span
        className={`rounded-full px-1.5 text-[10px] tabular ${
          active ? "bg-white/20" : "bg-white text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

export function useToggleState(initial = false) {
  const [open, setOpen] = useState(initial);
  return { open, setOpen, toggle: () => setOpen((v) => !v) };
}
