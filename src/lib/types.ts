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

export type DiscType = "putter" | "midrange" | "fairway_driver" | "distance_driver";

export type BagDisc = {
  id: string;
  userId: string;
  discName: string;
  manufacturer?: string;
  type: DiscType;
  speed: number;
  glide?: number;
  turn?: number;
  fade?: number;
  plastic?: string;
  color?: string;
  weightG?: number;
  notes?: string;
  createdAt: string;
};

export const DISC_TYPE_LABELS: Record<DiscType, string> = {
  putter: "Putter",
  midrange: "Midrange",
  fairway_driver: "Fairway Driver",
  distance_driver: "Distance Driver",
};

export const DISC_TYPE_COLORS: Record<DiscType, string> = {
  putter: "#a855f7",
  midrange: "#22c55e",
  fairway_driver: "#3b82f6",
  distance_driver: "#ef4444",
};

export type PlayerStats = {
  player: Player;
  roundsPlayed: number;
  wins: number;
  points: number;
  avgFinish: number | null;
};
