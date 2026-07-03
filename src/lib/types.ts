import type { PlayerId, AuthUserId } from "./id-validation";

export type Player = {
  id: PlayerId;
  name: string;
  slug: string;
  udiscHandle?: string;
  udiscAvatarUrl?: string;
  active: boolean;
};

export type RoundResult = {
  playerId: PlayerId;
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
  championPlayerId?: PlayerId;
  championName: string;
  note?: string;
  badgeImageUrl?: string;
  initialBadgeHolderPlayerId?: PlayerId;
};

export type Settings = {
  currentSeason: number;
};

export type PatchTransfer = {
  id: string;
  season: number;
  fromPlayerId?: PlayerId;
  toPlayerId: PlayerId;
  effectiveAfterRoundId?: string;
  reason?: string;
  createdAt: string;
};

export type DiscType = "putter" | "midrange" | "fairway_driver" | "distance_driver";

export type BagDisc = {
  id: string;
  userId: AuthUserId;
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
  nickname?: string;
  inStorage?: boolean;
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
