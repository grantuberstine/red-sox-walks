import type { PitcherStats, SeasonState, WalkRecord } from "./types";
import { headshotUrl } from "./achievements";

export type RangeKey = "today" | "week" | "month" | "season";

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Last game",
  week: "Last 7 days",
  month: "Last 30 days",
  season: "Season",
};

function addDays(yyyymmdd: string, days: number): string {
  const d = new Date(yyyymmdd + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function rangeBounds(
  range: RangeKey,
  state: Pick<SeasonState, "walks" | "meta">,
): { start: string | null; end: string | null } {
  const latest =
    state.meta.lastGameDate ??
    state.walks[0]?.date ??
    new Date().toISOString().slice(0, 10);

  switch (range) {
    case "today":
      return { start: latest, end: latest };
    case "week":
      return { start: addDays(latest, -6), end: latest };
    case "month":
      return { start: addDays(latest, -29), end: latest };
    case "season":
    default:
      return { start: null, end: null };
  }
}

export function filterWalks(
  walks: WalkRecord[],
  range: RangeKey,
  state: Pick<SeasonState, "walks" | "meta">,
  query: string = "",
): WalkRecord[] {
  const { start, end } = rangeBounds(range, state);
  const q = query.trim().toLowerCase();
  return walks.filter((w) => {
    if (start && w.date < start) return false;
    if (end && w.date > end) return false;
    if (q && !w.pitcherName.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function aggregateByPitcher(
  walks: WalkRecord[],
  meta: Record<string, Pick<PitcherStats, "pitcherId" | "name" | "headshotUrl" | "achievements">>,
): PitcherStats[] {
  const map = new Map<number, PitcherStats>();

  const ensure = (id: number, name: string): PitcherStats => {
    const existing = map.get(id);
    if (existing) return existing;
    const base = meta[String(id)] ?? {
      pitcherId: id,
      name,
      headshotUrl: headshotUrl(id),
      achievements: [],
    };
    const fresh: PitcherStats = {
      pitcherId: id,
      name: base.name || name,
      headshotUrl: base.headshotUrl ?? headshotUrl(id),
      appearances: 0,
      totalWalks: 0,
      fourPitchWalks: 0,
      ohTwoWalks: 0,
      leadoffWalks: 0,
      twoOutWalks: 0,
      lastWalkDate: null,
      achievements: base.achievements ?? [],
    };
    map.set(id, fresh);
    return fresh;
  };

  const datesByPitcher = new Map<number, Set<string>>();

  for (const w of walks) {
    const p = ensure(w.pitcherId, w.pitcherName);
    p.totalWalks += 1;
    if (w.tags.includes("fourPitch")) p.fourPitchWalks += 1;
    if (w.tags.includes("ohTwo")) p.ohTwoWalks += 1;
    if (w.tags.includes("leadoff")) p.leadoffWalks += 1;
    if (w.tags.includes("twoOut")) p.twoOutWalks += 1;
    if (!p.lastWalkDate || w.date > p.lastWalkDate) p.lastWalkDate = w.date;

    if (!datesByPitcher.has(w.pitcherId)) datesByPitcher.set(w.pitcherId, new Set());
    datesByPitcher.get(w.pitcherId)!.add(w.date);
  }

  for (const [id, dates] of datesByPitcher) {
    const p = map.get(id);
    if (p) p.appearances = dates.size;
  }

  return [...map.values()];
}

export function formatRangeContext(
  range: RangeKey,
  state: Pick<SeasonState, "walks" | "meta">,
): string {
  if (range === "season") return "Full season";
  const { start, end } = rangeBounds(range, state);
  if (!start || !end) return "Full season";
  if (start === end) return `Games on ${formatDate(start)}`;
  return `${formatDate(start)} — ${formatDate(end)}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
}
