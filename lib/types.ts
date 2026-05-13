export type WalkType = "fourPitch" | "ohTwo" | "leadoff" | "twoOut";

export type PitcherStats = {
  pitcherId: number;
  name: string;
  headshotUrl: string;
  appearances: number;
  totalWalks: number;
  fourPitchWalks: number;
  ohTwoWalks: number;
  leadoffWalks: number;
  twoOutWalks: number;
  lastWalkDate: string | null;
  achievements: string[];
};

export type GameSummary = {
  gamePk: number;
  date: string;
  opponent: string;
  homeAway: "home" | "away";
  walksProcessed: number;
};

export type RecentWalk = {
  pitcherId: number;
  pitcherName: string;
  date: string;
  opponent: string;
  inning: number;
  halfInning: "top" | "bottom";
  batterName: string;
  finalCount: { balls: number; strikes: number };
  pitchesInPA: number;
  tags: WalkType[];
};

export type SeasonState = {
  season: number;
  teamId: number;
  processedGamePks: number[];
  pitchers: Record<string, PitcherStats>;
  games: GameSummary[];
  recentWalks: RecentWalk[];
  meta: {
    lastRefreshAt: string | null;
    lastGameDate: string | null;
    totalGames: number;
    totalWalks: number;
  };
};

export type WalkClassification = {
  pitcherId: number;
  pitcherName: string;
  date: string;
  inning: number;
  halfInning: "top" | "bottom";
  batterName: string;
  finalCount: { balls: number; strikes: number };
  pitchesInPA: number;
  isFourPitch: boolean;
  isOhTwo: boolean;
  isLeadoff: boolean;
  isTwoOut: boolean;
};

export type ScheduleGame = {
  gamePk: number;
  date: string;
  status: string;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
};
