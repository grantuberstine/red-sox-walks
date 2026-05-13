import {
  MLB_API_BASE,
  SEASON_END,
  SEASON_START,
  TRIPLE_A_SPORT_ID,
  WOOSOX_TEAM_ID,
} from "./constants";
import type { ScheduleGame } from "./types";

const COMPLETED_STATES = new Set([
  "Final",
  "Game Over",
  "Completed Early",
  "Completed Early: Rain",
]);

export async function fetchWooSoxSchedule(
  startDate: string = SEASON_START,
  endDate: string = SEASON_END,
): Promise<ScheduleGame[]> {
  const url =
    `${MLB_API_BASE}/api/v1/schedule` +
    `?sportId=${TRIPLE_A_SPORT_ID}` +
    `&teamId=${WOOSOX_TEAM_ID}` +
    `&startDate=${startDate}` +
    `&endDate=${endDate}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Schedule fetch failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();

  const games: ScheduleGame[] = [];
  for (const day of data.dates ?? []) {
    for (const g of day.games ?? []) {
      if (!COMPLETED_STATES.has(g.status?.detailedState)) continue;
      games.push({
        gamePk: g.gamePk,
        date: day.date,
        status: g.status.detailedState,
        homeTeamId: g.teams.home.team.id,
        homeTeamName: g.teams.home.team.name,
        awayTeamId: g.teams.away.team.id,
        awayTeamName: g.teams.away.team.name,
        homeScore: g.teams.home.score ?? null,
        awayScore: g.teams.away.score ?? null,
      });
    }
  }
  return games;
}

export type BoxscorePitching = {
  outs: number;
  walks: number;
  strikeouts: number;
  earnedRuns: number;
  homeRuns: number;
  hitByPitch: number;
  hits: number;
};

export type LiveFeed = {
  gamePk: number;
  homeTeamId: number;
  awayTeamId: number;
  plays: LivePlay[];
  pitching: Record<number, BoxscorePitching>;
};

export type LivePlay = {
  result: {
    eventType?: string;
    event?: string;
  };
  about: {
    inning: number;
    halfInning: "top" | "bottom";
    atBatIndex: number;
  };
  matchup: {
    batter: { id: number; fullName: string };
    pitcher: { id: number; fullName: string };
  };
  count: {
    balls: number;
    strikes: number;
    outs: number;
  };
  playEvents: PlayEvent[];
  runners?: PlayRunner[];
};

export type PlayRunner = {
  movement?: {
    originBase?: string | null;
    start?: string | null;
    end?: string | null;
    outBase?: string | null;
    isOut?: boolean;
  };
  details?: {
    runner?: { id?: number };
  };
};

export type PlayEvent = {
  isPitch?: boolean;
  details?: {
    call?: { code: string; description: string };
    description?: string;
    isBall?: boolean;
    isStrike?: boolean;
    type?: { code: string; description: string };
  };
  count?: {
    balls: number;
    strikes: number;
    outs: number;
  };
  pitchData?: {
    startSpeed?: number;
    endSpeed?: number;
  };
};

export async function fetchGameFeed(gamePk: number): Promise<LiveFeed> {
  const url = `${MLB_API_BASE}/api/v1.1/game/${gamePk}/feed/live`;
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(
          `Game feed fetch failed for ${gamePk}: ${res.status} ${res.statusText}`,
        );
      }
      const data = await res.json();
      const pitching: Record<number, BoxscorePitching> = {};
      const teams = data.liveData?.boxscore?.teams ?? {};
      for (const side of [teams.home, teams.away]) {
        const players = side?.players ?? {};
        for (const player of Object.values(players) as Array<{
          person?: { id?: number };
          stats?: { pitching?: Record<string, number> };
        }>) {
          const pid = player?.person?.id;
          const pit = player?.stats?.pitching;
          if (!pid || !pit) continue;
          const outs = (pit.outs as number) ?? 0;
          const bb = (pit.baseOnBalls as number) ?? 0;
          const k = (pit.strikeOuts as number) ?? 0;
          if (outs === 0 && bb === 0 && k === 0) continue;
          pitching[pid] = {
            outs,
            walks: bb,
            strikeouts: k,
            earnedRuns: (pit.earnedRuns as number) ?? 0,
            homeRuns: (pit.homeRuns as number) ?? 0,
            hitByPitch: (pit.hitByPitch as number) ?? 0,
            hits: (pit.hits as number) ?? 0,
          };
        }
      }
      return {
        gamePk,
        homeTeamId: data.gameData?.teams?.home?.id,
        awayTeamId: data.gameData?.teams?.away?.id,
        plays: (data.liveData?.plays?.allPlays ?? []) as LivePlay[],
        pitching,
      };
    } catch (e) {
      lastErr = e;
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
