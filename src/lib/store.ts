import { supabaseAdmin } from "./supabase/server";
import type { Player, Round, SeasonHistory, Settings } from "./types";

type PlayerRow = {
  id: string;
  name: string;
  udisc_handle: string | null;
  active: boolean;
};

type RoundRow = {
  id: string;
  date: string;
  season: number;
  source: "udisc" | "manual";
  udisc_url: string | null;
  course_name: string | null;
  note: string | null;
  results: { playerId: string; position: number }[];
  created_at: string;
};

type HistoryRow = {
  season: number;
  champion_player_id: string | null;
  champion_name: string;
  note: string | null;
  badge_image_url: string | null;
  initial_badge_holder_player_id: string | null;
};

type SettingsRow = { id: number; current_season: number };

function mapPlayer(r: PlayerRow): Player {
  return { id: r.id, name: r.name, udiscHandle: r.udisc_handle ?? undefined, active: r.active };
}

function mapRound(r: RoundRow): Round {
  return {
    id: r.id,
    date: r.date,
    season: r.season,
    source: r.source,
    udiscUrl: r.udisc_url ?? undefined,
    courseName: r.course_name ?? undefined,
    note: r.note ?? undefined,
    results: r.results,
    createdAt: r.created_at,
  };
}

function mapHistory(r: HistoryRow): SeasonHistory {
  return {
    season: r.season,
    championPlayerId: r.champion_player_id ?? undefined,
    championName: r.champion_name,
    note: r.note ?? undefined,
    badgeImageUrl: r.badge_image_url ?? undefined,
    initialBadgeHolderPlayerId: r.initial_badge_holder_player_id ?? undefined,
  };
}

export async function upsertSeasonHistory(h: SeasonHistory): Promise<void> {
  const { error } = await supabaseAdmin().from("season_history").upsert({
    season: h.season,
    champion_player_id: h.championPlayerId ?? null,
    champion_name: h.championName,
    note: h.note ?? null,
    badge_image_url: h.badgeImageUrl ?? null,
    initial_badge_holder_player_id: h.initialBadgeHolderPlayerId ?? null,
  });
  if (error) throw error;
}

export async function getRoster(): Promise<Player[]> {
  const { data, error } = await supabaseAdmin()
    .from("players")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data as PlayerRow[]).map(mapPlayer);
}

export async function upsertPlayer(p: Player): Promise<void> {
  const { error } = await supabaseAdmin().from("players").upsert({
    id: p.id,
    name: p.name,
    udisc_handle: p.udiscHandle ?? null,
    active: p.active,
  });
  if (error) throw error;
}

export async function getRounds(): Promise<Round[]> {
  const { data, error } = await supabaseAdmin()
    .from("rounds")
    .select("*")
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as RoundRow[]).map(mapRound);
}

export async function insertRound(r: Round): Promise<void> {
  const { error } = await supabaseAdmin().from("rounds").insert({
    id: r.id,
    date: r.date,
    season: r.season,
    source: r.source,
    udisc_url: r.udiscUrl ?? null,
    course_name: r.courseName ?? null,
    note: r.note ?? null,
    results: r.results,
  });
  if (error) throw error;
}

export async function deleteRound(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("rounds").delete().eq("id", id);
  if (error) throw error;
}

export async function getHistory(): Promise<SeasonHistory[]> {
  const { data, error } = await supabaseAdmin()
    .from("season_history")
    .select("*")
    .order("season", { ascending: false });
  if (error) throw error;
  return (data as HistoryRow[]).map(mapHistory);
}

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabaseAdmin()
    .from("settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const fallback = { currentSeason: new Date().getFullYear() };
    await supabaseAdmin()
      .from("settings")
      .upsert({ id: 1, current_season: fallback.currentSeason });
    return fallback;
  }
  return { currentSeason: (data as SettingsRow).current_season };
}

export async function saveSettings(s: Settings): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("settings")
    .upsert({ id: 1, current_season: s.currentSeason });
  if (error) throw error;
}
