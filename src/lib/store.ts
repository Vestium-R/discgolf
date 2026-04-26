import { supabaseAdmin } from "./supabase/server";
import type { Player, Round, RoundVariant, SeasonHistory, Settings } from "./types";

type PlayerRow = {
  id: string;
  name: string;
  udisc_handle: string | null;
  udisc_avatar_url: string | null;
  active: boolean;
};

type RoundRow = {
  id: string;
  date: string;
  season: number;
  source: "udisc" | "manual" | "linked";
  udisc_url: string | null;
  course_name: string | null;
  note: string | null;
  variant: string | null;
  counts: boolean | null;
  temperature_c: number | string | null;
  temperature_f: number | null;
  wind_mph: number | null;
  wind_kph: number | null;
  results: { playerId: string; position: number; score?: number; relativeScore?: number; rating?: number }[];
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
  return {
    id: r.id,
    name: r.name,
    udiscHandle: r.udisc_handle ?? undefined,
    udiscAvatarUrl: r.udisc_avatar_url ?? undefined,
    active: r.active,
  };
}

function mapRound(r: RoundRow): Round {
  const variant = (r.variant ?? "standard") as RoundVariant;
  let tempC: number | undefined;
  if (r.temperature_c != null) {
    tempC = Number(r.temperature_c);
  } else if (r.temperature_f != null) {
    tempC = Math.round(((r.temperature_f - 32) * 5) / 9 * 10) / 10;
  }
  let windKph: number | undefined;
  if (r.wind_kph != null) {
    windKph = Number(r.wind_kph);
  } else if (r.wind_mph != null) {
    windKph = Math.round(r.wind_mph * 1.60934);
  }
  return {
    id: r.id,
    date: r.date,
    season: r.season,
    source: r.source,
    udiscUrl: r.udisc_url ?? undefined,
    courseName: r.course_name ?? undefined,
    note: r.note ?? undefined,
    variant,
    counts: r.counts ?? true,
    temperatureC: tempC,
    windKph,
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
  const sb = supabaseAdmin();
  const base: Record<string, unknown> = {
    season: h.season,
    champion_player_id: h.championPlayerId ?? null,
    champion_name: h.championName,
    note: h.note ?? null,
    badge_image_url: h.badgeImageUrl ?? null,
    initial_badge_holder_player_id: h.initialBadgeHolderPlayerId ?? null,
  };
  const { error } = await sb.from("season_history").upsert(base);
  if (!error) return;
  // Fallback when schema doesn't have the newer columns (migration not run yet)
  const msg = error.message?.toLowerCase() ?? "";
  if (msg.includes("initial_badge_holder_player_id") || msg.includes("badge_image_url")) {
    delete base.initial_badge_holder_player_id;
    delete base.badge_image_url;
    const { error: e2 } = await sb.from("season_history").upsert(base);
    if (e2) throw e2;
    throw new Error(
      "Saved name/champion, but your Supabase is missing columns badge_image_url and/or initial_badge_holder_player_id — run migrations 003 and 004."
    );
  }
  throw error;
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
    udisc_avatar_url: p.udiscAvatarUrl ?? null,
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
    variant: r.variant ?? "standard",
    counts: r.counts ?? true,
    temperature_c: r.temperatureC ?? null,
    wind_kph: r.windKph ?? null,
    results: r.results,
  });
  if (error) throw error;
}

export async function updateRoundVariant(id: string, variant: RoundVariant): Promise<void> {
  // Variants are cosmetic labels now — all rounds count unless explicitly unticked
  const { error } = await supabaseAdmin()
    .from("rounds")
    .update({ variant })
    .eq("id", id);
  if (error) throw error;
}

export async function updateRoundCounts(id: string, counts: boolean): Promise<void> {
  const { error } = await supabaseAdmin().from("rounds").update({ counts }).eq("id", id);
  if (error) throw error;
}

export async function updateRoundResults(id: string, results: Round["results"]): Promise<void> {
  const { error } = await supabaseAdmin().from("rounds").update({ results }).eq("id", id);
  if (error) throw error;
}

export async function setPlayerAvatarIfMissing(playerId: string, avatarUrl: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("players")
    .update({ udisc_avatar_url: avatarUrl })
    .eq("id", playerId)
    .is("udisc_avatar_url", null);
  if (error) throw error;
}

export async function setPlayerActive(playerId: string, active: boolean): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("players")
    .update({ active })
    .eq("id", playerId);
  if (error) throw error;
}

export async function updateRoundWeather(id: string, temperatureC: number | null, windKph: number | null): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("rounds")
    .update({ temperature_c: temperatureC, wind_kph: windKph })
    .eq("id", id);
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
