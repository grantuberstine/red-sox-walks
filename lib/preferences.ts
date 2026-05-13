"use client";

import { useEffect, useState } from "react";

const KEY_HIDDEN = "woosox.hiddenPitchers.v1";

export function loadHiddenPitchers(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(KEY_HIDDEN);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(Number) : []);
  } catch {
    return new Set();
  }
}

export function saveHiddenPitchers(ids: Set<number>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_HIDDEN, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

export function useHiddenPitchers(): {
  hidden: Set<number>;
  toggle: (id: number) => void;
  setAll: (ids: number[]) => void;
  showAll: () => void;
  hideAll: (allIds: number[]) => void;
} {
  const [hidden, setHidden] = useState<Set<number>>(new Set());

  useEffect(() => {
    setHidden(loadHiddenPitchers());
  }, []);

  const update = (next: Set<number>) => {
    setHidden(next);
    saveHiddenPitchers(next);
  };

  return {
    hidden,
    toggle: (id) => {
      const next = new Set(hidden);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      update(next);
    },
    setAll: (ids) => update(new Set(ids)),
    showAll: () => update(new Set()),
    hideAll: (allIds) => update(new Set(allIds)),
  };
}
