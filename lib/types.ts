export type WalkType = "fourPitch" | "ohTwo" | "leadoff" | "twoOut";
export type StrikeoutType = "threePitch" | "side";

export type PitcherStats = {
  pitcherId: number;
  name: string;
  headshotUrl: string;
  appearances: number;
  outsRecorded: number;
  totalWalks: number;
  fourPitchWalks: number;
  ohTwoWalks: number;
  leadoffWalks: number;
  twoOutWalks: number;
  totalStrikeouts: number;
  threePitchStrikeouts: number;
  sideStrikeouts: number;
  lastWalkDate: string | null;
  lastStrikeoutDate: string | null;
  achievements: string[];
};

export type GameSummary = {
  gamePk: number;
  date: string;
  opponent: string;
  homeAway: "home" | "away";
  walksProcessed: number;
  strikeoutsProcessed: number;
  teamScore: number | null;
  opponentScore: number | null;
  result: "W" | "L" | "T" | null;
};

export type WalkRecord = {
  gamePk: number;
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

export type StrikeoutRecord = {
  gamePk: number;
  pitcherId: number;
  pitcherName: string;
  date: string;
  opponent: string;
  inning: number;
  halfInning: "top" | "bottom";
  batterName: string;
  pitchesInPA: number;
  tags: StrikeoutType[];
};

export type PitchTypeStats = {
  type: string;
  count: number;
  avgVelo: number;
  maxVelo: number;
};

export type AppearanceVelo = {
  gamePk: number;
  date: string;
  opponent: string;
  pitchCount: number;
  avgVelo: number;
  maxVelo: number;
  byType: PitchTypeStats[];
};

export type SeasonState = {
  season: number;
  teamId: number;
  processedGamePks: number[];
  pitchers: Record<string, PitcherStats>;
  games: GameSummary[];
  walks: WalkRecord[];
  strikeouts: StrikeoutRecord[];
  velocity: Record<string, AppearanceVelo[]>;
  meta: {
    lastRefreshAt: string | null;
    lastGameDate: string | null;
    totalGames: number;
    totalWalks: number;
    totalStrikeouts: number;
    totalOutsRecorded: number;
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

export type StrikeoutClassification = {
  pitcherId: number;
  pitcherName: string;
  date: string;
  inning: number;
  halfInning: "top" | "bottom";
  batterName: string;
  pitchesInPA: number;
  isThreePitch: boolean;
  isSide: boolean;
};

export type ScheduleGame = {
  gamePk: number;
  date: string;
  status: string;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
};
