export type Player = {
  id: string;
  name: string;
  udiscHandle?: string;
  active: boolean;
};

export type RoundResult = {
  playerId: string;
  position: number;
};

export type Round = {
  id: string;
  date: string;
  season: number;
  source: "udisc" | "manual";
  udiscUrl?: string;
  courseName?: string;
  note?: string;
  results: RoundResult[];
  createdAt: string;
};

export type SeasonHistory = {
  season: number;
  championPlayerId?: string;
  championName: string;
  note?: string;
};

export type Settings = {
  currentSeason: number;
};

export type PlayerStats = {
  player: Player;
  roundsPlayed: number;
  wins: number;
  points: number;
  avgFinish: number | null;
};
