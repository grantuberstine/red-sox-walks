"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PitcherAvatar } from "./PitcherAvatar";

export type SearchSuggestion = {
  id: number;
  name: string;
  headshotUrl: string;
  hint?: string;
};

export function SearchInput({
  value,
  onChange,
  suggestions,
  placeholder = "Search pitcher…",
  maxResults = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: SearchSuggestion[];
  placeholder?: string;
  maxResults?: number;
}) {
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    const startsWith: SearchSuggestion[] = [];
    const contains: SearchSuggestion[] = [];
    for (const s of suggestions) {
      const name = s.name.toLowerCase();
      if (name === q) startsWith.unshift(s);
      else if (name.startsWith(q)) startsWith.push(s);
      else if (name.includes(q)) contains.push(s);
    }
    return [...startsWith, ...contains].slice(0, maxResults);
  }, [value, suggestions, maxResults]);

  const showDropdown = focused && filtered.length > 0;

  useEffect(() => {
    if (highlight >= filtered.length) setHighlight(0);
  }, [filtered.length, highlight]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const select = (s: SearchSuggestion) => {
    onChange(s.name);
    setFocused(false);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      if (showDropdown && filtered[highlight]) {
        e.preventDefault();
        select(filtered[highlight]);
      }
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full sm:w-72">
      <SearchIcon />
      <input
        type="search"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setFocused(true);
        }}
        onFocus={() => setFocused(true)}
        onKeyDown={onKey}
        placeholder={placeholder}
        autoComplete="off"
        className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-8 pr-8 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-sox-red)] focus:outline-none focus:ring-2 focus:ring-[var(--color-sox-red)]/15"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange("");
            setFocused(false);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {showDropdown && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg ring-1 ring-black/5"
        >
          {filtered.map((s, i) => {
            const active = i === highlight;
            return (
              <li
                key={s.id}
                role="option"
                aria-selected={active}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(s);
                }}
                className={`flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm ${
                  active ? "bg-[var(--surface-subtle)]" : ""
                }`}
              >
                <PitcherAvatar name={s.name} src={s.headshotUrl} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-[var(--text)]">
                    <Highlight text={s.name} query={value} />
                  </div>
                  {s.hint && (
                    <div className="truncate text-[11px] text-[var(--text-muted)]">
                      {s.hint}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-rose-200 px-0.5 text-[var(--text)] dark:bg-rose-500/40 dark:text-white">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}
