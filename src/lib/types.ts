export type Player = {
  id: string;
  name: string;
  udiscHandle?: string;
  udiscAvatarUrl?: string;
  active: boolean;
};

export type RoundResult = {
  playerId: string;
  position: number;
  score?: number;
  relativeScore?: number;
  rating?: number;
};

export type RoundVariant = "standard" | "chiplocked" | "legends" | "other";

export type Round = {
  id: string;
  date: string;
  season: number;
  source: "udisc" | "manual" | "linked";
  udiscUrl?: string;
  courseName?: string;
  note?: string;
  variant: RoundVariant;
  counts: boolean;
  temperatureC?: number;
  windKph?: number;
  results: RoundResult[];
  createdAt: string;
};

export const VARIANT_LABELS: Record<RoundVariant, string> = {
  standard: "Standard",
  chiplocked: "Chiplocked",
  legends: "Legends of the Chains",
  other: "Other",
};

export const VARIANT_EMOJI: Record<RoundVariant, string> = {
  standard: "🥏",
  chiplocked: "🎴",
  legends: "🃏",
  other: "✨",
};

export type SeasonHistory = {
  season: number;
  championPlayerId?: string;
  championName: string;
  note?: string;
  badgeImageUrl?: string;
  initialBadgeHolderPlayerId?: string;
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
