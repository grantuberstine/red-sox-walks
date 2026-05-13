"use client";

import { useMemo, useState } from "react";
import type { PitcherStats } from "@/lib/types";
import { PitcherAvatar } from "./PitcherAvatar";

export function RosterDrawer({
  open,
  onClose,
  pitchers,
  hidden,
  onToggle,
  onShowAll,
  onHideAll,
}: {
  open: boolean;
  onClose: () => void;
  pitchers: PitcherStats[];
  hidden: Set<number>;
  onToggle: (id: number) => void;
  onShowAll: () => void;
  onHideAll: (allIds: number[]) => void;
}) {
  const [search, setSearch] = useState("");

  const sorted = useMemo(() => {
    const rows = [...pitchers];
    rows.sort((a, b) => {
      const aHidden = hidden.has(a.pitcherId) ? 1 : 0;
      const bHidden = hidden.has(b.pitcherId) ? 1 : 0;
      if (aHidden !== bHidden) return aHidden - bHidden;
      return b.totalWalks + b.totalStrikeouts - (a.totalWalks + a.totalStrikeouts);
    });
    return rows;
  }, [pitchers, hidden]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((p) => p.name.toLowerCase().includes(q));
  }, [sorted, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl sm:rounded-l-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[var(--color-sox-navy)]">
              Manage Roster
            </h2>
            <p className="text-[11px] text-slate-500">
              Hide pitchers who are no longer on the team
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="border-b border-slate-200 px-5 py-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pitchers…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm placeholder:text-slate-400 focus:border-[var(--color-sox-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--color-sox-navy)]/10"
          />
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {pitchers.length - hidden.size} active · {hidden.size} hidden
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onShowAll}
                className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 hover:bg-slate-200"
              >
                Show all
              </button>
              <button
                type="button"
                onClick={() => onHideAll(pitchers.map((p) => p.pitcherId))}
                className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 hover:bg-slate-200"
              >
                Hide all
              </button>
            </div>
          </div>
        </div>

        <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-slate-500">
              No pitchers match.
            </li>
          ) : (
            filtered.map((p) => {
              const isHidden = hidden.has(p.pitcherId);
              return (
                <li
                  key={p.pitcherId}
                  className={`flex items-center gap-3 px-5 py-2.5 transition ${
                    isHidden ? "opacity-50" : ""
                  }`}
                >
                  <PitcherAvatar
                    name={p.name}
                    src={p.headshotUrl}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-[var(--color-sox-navy)]">
                      {p.name}
                    </div>
                    <div className="text-[11px] tabular text-slate-500">
                      {p.totalWalks} BB · {p.totalStrikeouts} K
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggle(p.pitcherId)}
                    aria-pressed={!isHidden}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                      isHidden ? "bg-slate-200" : "bg-emerald-500"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                        isHidden ? "translate-x-0.5" : "translate-x-[22px]"
                      }`}
                    />
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <footer className="border-t border-slate-200 px-5 py-3 text-[11px] text-slate-500">
          Preferences saved on this device.
        </footer>
      </div>
    </div>
  );
}
