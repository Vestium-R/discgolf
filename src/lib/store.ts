import { supabaseAdmin } from "./supabase/server";
import type { BagDisc, Player, Round, RoundVariant, SeasonHistory, Settings } from "./types";
import { validateRoundResultIds, validateSeasonHistoryIds, analyzeIdFormats, asPlayerId, asAuthUserId, type PlayerId, type AuthUserId } from "./id-validation";

type PlayerRow = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
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
    id: asPlayerId(r.id, "players row"),
    name: r.name,
    slug: r.slug,
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
    results: r.results.map(res => ({
      ...res,
      playerId: asPlayerId(res.playerId, `round ${r.id}`),
    })),
    createdAt: r.created_at,
  };
}

function mapHistory(r: HistoryRow): SeasonHistory {
  return {
    season: r.season,
    championPlayerId: r.champion_player_id
      ? asPlayerId(r.champion_player_id, `season_history season ${r.season}`)
      : undefined,
    championName: r.champion_name,
    note: r.note ?? undefined,
    badgeImageUrl: r.badge_image_url ?? undefined,
    initialBadgeHolderPlayerId: r.initial_badge_holder_player_id
      ? asPlayerId(r.initial_badge_holder_player_id, `season_history season ${r.season}`)
      : undefined,
  };
}

export async function upsertSeasonHistory(h: SeasonHistory): Promise<void> {
  // Validate player ID references
  const validation = validateSeasonHistoryIds(h.championPlayerId, h.initialBadgeHolderPlayerId, h.season);
  if (!validation.valid) {
    throw new Error(`Invalid player IDs in season ${h.season}: ${validation.errors.join("; ")}`);
  }

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

export async function getPlayerByAuthEmail(email: string): Promise<Player | null> {
  const { data, error } = await supabaseAdmin()
    .from("players")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !data) return null;
  return mapPlayer(data as PlayerRow);
}

export async function upsertPlayer(p: Player, email?: string): Promise<void> {
  const { error } = await supabaseAdmin().from("players").upsert({
    id: p.id,
    name: p.name,
    slug: p.slug,
    email: email ?? null,
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
  // Validate player IDs in results
  const playerIds = r.results.map(res => res.playerId);
  const validation = validateRoundResultIds(playerIds, `round ${r.id}`);
  if (!validation.valid) {
    throw new Error(`Invalid player IDs in round: ${validation.errors.join("; ")}`);
  }

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
  // Validate player IDs in results
  const playerIds = results.map(res => res.playerId);
  const validation = validateRoundResultIds(playerIds, `round ${id}`);
  if (!validation.valid) {
    throw new Error(`Invalid player IDs in round: ${validation.errors.join("; ")}`);
  }

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

// ─── Migrations ─────────────────────────────────────────────────────────────

export async function migratePlayerIdsInRounds(): Promise<{ updated: number; errors: string[] }> {
  const [players, rounds] = await Promise.all([getRoster(), getRounds()]);
  const slugToId = new Map(players.map(p => [p.slug, p.id]));

  let updated = 0;
  const errors: string[] = [];

  for (const round of rounds) {
    const updatedResults = round.results.map(res => {
      // If already UUID (36 chars), keep as-is
      if (res.playerId.length === 36) {
        return res;
      }

      // Try to find UUID for this slug/old ID
      const uuid = slugToId.get(res.playerId);
      if (uuid) {
        return { ...res, playerId: uuid };
      } else {
        // Couldn't find mapping for this old ID
        errors.push(`Round ${round.id}: Could not find player for "${res.playerId}"`);
        return res; // Keep old ID
      }
    });

    // Only update if there were changes
    if (JSON.stringify(updatedResults) !== JSON.stringify(round.results)) {
      const { error } = await supabaseAdmin()
        .from("rounds")
        .update({ results: updatedResults })
        .eq("id", round.id);

      if (error) {
        errors.push(`Round ${round.id}: ${error.message}`);
      } else {
        updated++;
      }
    }
  }

  return { updated, errors };
}

export async function migratePlayerIdsInHistory(): Promise<{ updated: number; errors: string[] }> {
  const [players, { data: history }] = await Promise.all([
    getRoster(),
    supabaseAdmin().from("season_history").select("*"),
  ]);
  const slugToId = new Map(players.map(p => [p.slug, p.id]));

  let updated = 0;
  const errors: string[] = [];

  if (!history) return { updated: 0, errors: ["Failed to fetch season_history"] };

  for (const row of history as HistoryRow[]) {
    let changed = false;
    const updates: Record<string, string | null> = {};

    // Check champion_player_id
    if (row.champion_player_id && row.champion_player_id.length < 36) {
      const uuid = slugToId.get(row.champion_player_id);
      if (uuid) {
        updates.champion_player_id = uuid;
        changed = true;
      } else {
        errors.push(`Season ${row.season}: Could not find player for champion "${row.champion_player_id}"`);
      }
    }

    // Check initial_badge_holder_player_id
    if (row.initial_badge_holder_player_id && row.initial_badge_holder_player_id.length < 36) {
      const uuid = slugToId.get(row.initial_badge_holder_player_id);
      if (uuid) {
        updates.initial_badge_holder_player_id = uuid;
        changed = true;
      } else {
        errors.push(`Season ${row.season}: Could not find player for badge holder "${row.initial_badge_holder_player_id}"`);
      }
    }

    if (changed) {
      const { error } = await supabaseAdmin()
        .from("season_history")
        .update(updates)
        .eq("season", row.season);

      if (error) {
        errors.push(`Season ${row.season}: ${error.message}`);
      } else {
        updated++;
      }
    }
  }

  return { updated, errors };
}

// ─── User prefs ─────────────────────────────────────────────────────────────

export type UserPrefs = {
  maxDistFt: number;
  throwStyle: string;   // RHBH | LHBH | RHFH | LHFH
  playStyle: string;    // flat | hyzer_flip | anhyzer | beginner
  yearsPlaying?: number;
};

const DEFAULT_USER_PREFS: UserPrefs = { maxDistFt: 300, throwStyle: "RHBH", playStyle: "flat" };

export async function getUserPrefs(userId: string): Promise<UserPrefs> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("user_prefs")
      .select("max_dist_ft, throw_style, play_style, years_playing")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return DEFAULT_USER_PREFS;
    return {
      maxDistFt: data.max_dist_ft,
      throwStyle: data.throw_style,
      playStyle: data.play_style ?? "flat",
      yearsPlaying: data.years_playing ?? undefined,
    };
  } catch {
    return DEFAULT_USER_PREFS;
  }
}

export async function saveUserPrefs(userId: string, prefs: UserPrefs): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("user_prefs")
    .upsert({
      user_id: userId,
      max_dist_ft: prefs.maxDistFt,
      throw_style: prefs.throwStyle,
      play_style: prefs.playStyle,
      years_playing: prefs.yearsPlaying ?? null,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}

export async function saveSettings(s: Settings): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("settings")
    .upsert({ id: 1, current_season: s.currentSeason });
  if (error) throw error;
}

// ─── Bag ───────────────────────────────────────────────────────────────────

type BagDiscRow = {
  id: string;
  user_id: string;
  disc_name: string;
  manufacturer: string | null;
  type: string;
  speed: number;
  glide: number | null;
  turn: number | null;
  fade: number | null;
  plastic: string | null;
  color: string | null;
  weight_g: number | null;
  notes: string | null;
  nickname: string | null;
  in_storage: boolean | null;
  created_at: string;
};

function rowToDisc(r: BagDiscRow): BagDisc {
  return {
    id: r.id,
    userId: asAuthUserId(r.user_id, "bag_discs row"),
    discName: r.disc_name,
    manufacturer: r.manufacturer ?? undefined,
    type: r.type as BagDisc["type"],
    speed: Number(r.speed),
    glide: r.glide != null ? Number(r.glide) : undefined,
    turn: r.turn != null ? Number(r.turn) : undefined,
    fade: r.fade != null ? Number(r.fade) : undefined,
    plastic: r.plastic ?? undefined,
    color: r.color ?? undefined,
    weightG: r.weight_g ?? undefined,
    notes: r.notes ?? undefined,
    nickname: r.nickname ?? undefined,
    inStorage: r.in_storage ?? false,
    createdAt: r.created_at,
  };
}

export async function getBagDiscs(userId: AuthUserId): Promise<BagDisc[]> {
  const { data, error } = await supabaseAdmin()
    .from("bag_discs")
    .select("*")
    .eq("user_id", userId)
    .order("type")
    .order("speed");
  if (error) throw error;
  return (data as BagDiscRow[]).map(rowToDisc);
}

export async function addBagDisc(userId: AuthUserId, disc: Omit<BagDisc, "id" | "userId" | "createdAt">): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("bag_discs")
    .insert({
      user_id: userId,
      disc_name: disc.discName,
      manufacturer: disc.manufacturer ?? null,
      type: disc.type,
      speed: disc.speed,
      glide: disc.glide ?? null,
      turn: disc.turn ?? null,
      fade: disc.fade ?? null,
      plastic: disc.plastic ?? null,
      color: disc.color ?? null,
      weight_g: disc.weightG ?? null,
      notes: disc.notes ?? null,
      nickname: disc.nickname ?? null,
    });
  if (error) throw error;
}

export async function updateBagDisc(id: string, userId: AuthUserId, disc: Partial<Omit<BagDisc, "id" | "userId" | "createdAt">>): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (disc.discName !== undefined)    patch.disc_name    = disc.discName;
  if (disc.manufacturer !== undefined) patch.manufacturer = disc.manufacturer ?? null;
  if (disc.type !== undefined)        patch.type         = disc.type;
  if (disc.speed !== undefined)       patch.speed        = disc.speed;
  if (disc.glide !== undefined)       patch.glide        = disc.glide ?? null;
  if (disc.turn !== undefined)        patch.turn         = disc.turn ?? null;
  if (disc.fade !== undefined)        patch.fade         = disc.fade ?? null;
  if (disc.plastic !== undefined)     patch.plastic      = disc.plastic ?? null;
  if (disc.color !== undefined)       patch.color        = disc.color ?? null;
  if (disc.weightG !== undefined)     patch.weight_g     = disc.weightG ?? null;
  if (disc.notes !== undefined)       patch.notes        = disc.notes ?? null;
  const { error } = await supabaseAdmin()
    .from("bag_discs")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function toggleBagStorage(id: string, userId: AuthUserId, inStorage: boolean): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("bag_discs")
    .update({ in_storage: inStorage })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function removeBagDisc(id: string, userId: AuthUserId): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("bag_discs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export type DataIntegrityReport = {
  playerCount: number;
  playersWithUUID: number;
  playersWithInvalidId: number;
  roundCount: number;
  orphanedRoundResultCount: number;
  roundsWithMixedIds: number;
  seasonHistoryCount: number;
  orphanedChampionIds: number;
  orphanedBadgeHolderIds: number;
  bagDiscCount: number;
  bagDiscsWithInvalidUserId: number;
  checkedAt: string;
};

export type DiscThrowStats = {
  bagDiscId: string;
  throwCount: number;
  totalDistanceFt: number;
  avgDistanceFt: number;
  bestDistanceFt: number;
  worstDistanceFt: number;
};

export async function getDiscThrowStats(userId: AuthUserId): Promise<Map<string, DiscThrowStats>> {
  const { data, error } = await supabaseAdmin()
    .from("disc_throws")
    .select("bag_disc_id, distance_ft")
    .eq("user_id", userId);

  if (error) throw error;

  const throws = (data as Array<{ bag_disc_id: string; distance_ft: number }>) || [];
  const statsByDisc = new Map<string, DiscThrowStats>();

  for (const t of throws) {
    const stats = statsByDisc.get(t.bag_disc_id) ?? {
      bagDiscId: t.bag_disc_id,
      throwCount: 0,
      totalDistanceFt: 0,
      avgDistanceFt: 0,
      bestDistanceFt: 0,
      worstDistanceFt: Infinity,
    };

    stats.throwCount += 1;
    stats.totalDistanceFt += t.distance_ft;
    stats.bestDistanceFt = Math.max(stats.bestDistanceFt, t.distance_ft);
    stats.worstDistanceFt = Math.min(stats.worstDistanceFt, t.distance_ft);
    stats.avgDistanceFt = Math.round(stats.totalDistanceFt / stats.throwCount);

    statsByDisc.set(t.bag_disc_id, stats);
  }

  // Fix infinity for worst if no throws
  for (const stats of statsByDisc.values()) {
    if (stats.worstDistanceFt === Infinity) {
      stats.worstDistanceFt = 0;
    }
  }

  return statsByDisc;
}

export async function runDataIntegrityChecks(): Promise<DataIntegrityReport> {
  const supabase = supabaseAdmin();
  const [playersRes, roundsRes, historyRes, bagDiscsRes] = await Promise.all([
    supabase.from("players").select("id"),
    supabase.from("rounds").select("id, results"),
    supabase.from("season_history").select("season, champion_player_id, initial_badge_holder_player_id"),
    supabase.from("bag_discs").select("user_id"),
  ]);

  const players = (playersRes.data || []) as Array<{ id: string }>;
  const rounds = (roundsRes.data || []) as Array<{ id: string; results: Array<{ playerId: string }> }>;
  const history = (historyRes.data || []) as Array<{
    season: number;
    champion_player_id: string | null;
    initial_badge_holder_player_id: string | null;
  }>;
  const bagDiscs = (bagDiscsRes.data || []) as Array<{ user_id: string }>;

  const validPlayerIds = new Set(players.map((p) => p.id));

  // Player ID analysis
  const playerIds = players.map((p) => p.id);
  const { uuids: playersWithUUID, invalid: playersWithInvalidId } = analyzeIdFormats(playerIds);

  // Round analysis
  let orphanedRoundResultCount = 0;
  let roundsWithMixedIds = 0;

  for (const round of rounds) {
    const resultPlayerIds = round.results.map((r) => r.playerId);
    const validation = validateRoundResultIds(resultPlayerIds, `round ${round.id}`);
    if (!validation.valid) roundsWithMixedIds += 1;

    for (const result of round.results) {
      if (!validPlayerIds.has(result.playerId)) {
        orphanedRoundResultCount += 1;
      }
    }
  }

  // Season history analysis
  let orphanedChampionIds = 0;
  let orphanedBadgeHolderIds = 0;
  for (const h of history) {
    if (h.champion_player_id && !validPlayerIds.has(h.champion_player_id)) {
      orphanedChampionIds += 1;
    }
    if (h.initial_badge_holder_player_id && !validPlayerIds.has(h.initial_badge_holder_player_id)) {
      orphanedBadgeHolderIds += 1;
    }
  }

  // Bag discs user_id analysis
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const bagDiscsWithInvalidUserId = bagDiscs.filter((d) => !uuidRegex.test(d.user_id)).length;

  return {
    playerCount: players.length,
    playersWithUUID: playersWithUUID.length,
    playersWithInvalidId: playersWithInvalidId.length,
    roundCount: rounds.length,
    orphanedRoundResultCount,
    roundsWithMixedIds,
    seasonHistoryCount: history.length,
    orphanedChampionIds,
    orphanedBadgeHolderIds,
    bagDiscCount: bagDiscs.length,
    bagDiscsWithInvalidUserId,
    checkedAt: new Date().toISOString(),
  };
}
