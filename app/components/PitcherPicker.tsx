"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PitcherStats } from "@/lib/types";
import { PitcherAvatar } from "./PitcherAvatar";

export function PitcherPicker({
  pitchers,
  value,
  onChange,
  placeholder = "Pick a pitcher",
}: {
  pitchers: PitcherStats[];
  value: number | null;
  onChange: (id: number) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => pitchers.find((p) => p.pitcherId === value) ?? null,
    [pitchers, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pitchers;
    return pitchers.filter((p) => p.name.toLowerCase().includes(q));
  }, [pitchers, query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const select = (id: number) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapRef} className="relative w-full sm:w-72">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-sm text-[var(--text)] transition hover:border-[var(--border-strong)]"
      >
        {selected ? (
          <>
            <PitcherAvatar
              name={selected.name}
              src={selected.headshotUrl}
              size={24}
            />
            <span className="min-w-0 flex-1 truncate text-left font-medium">
              {selected.name}
            </span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-left text-[var(--text-muted)]">
            {placeholder}
          </span>
        )}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 text-[var(--text-muted)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-full min-w-[260px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg ring-1 ring-black/5">
          <div className="border-b border-[var(--border)] p-2">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-sox-red)] focus:outline-none focus:ring-2 focus:ring-[var(--color-sox-red)]/15"
            />
          </div>
          <ul
            role="listbox"
            className="max-h-72 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                No pitchers match
              </li>
            ) : (
              filtered.map((p) => {
                const active = p.pitcherId === value;
                return (
                  <li
                    key={p.pitcherId}
                    role="option"
                    aria-selected={active}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      select(p.pitcherId);
                    }}
                    className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm transition ${
                      active
                        ? "bg-[var(--color-sox-red)]/10 text-[var(--text)]"
                        : "text-[var(--text)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <PitcherAvatar
                      name={p.name}
                      src={p.headshotUrl}
                      size={26}
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {p.name}
                    </span>
                    {active && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-[var(--color-sox-red)]"
                      >
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
