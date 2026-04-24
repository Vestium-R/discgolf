import type { Player, PlayerStats, Round } from "./types";

/**
 * N - position + 1 with ties splitting points.
 */
export function pointsForRound(round: Round): Map<string, number> {
  const n = round.results.length;
  const byPos = new Map<number, string[]>();
  for (const r of round.results) {
    const arr = byPos.get(r.position) ?? [];
    arr.push(r.playerId);
    byPos.set(r.position, arr);
  }
  const out = new Map<string, number>();
  for (const [pos, players] of byPos) {
    let sum = 0;
    for (let i = 0; i < players.length; i++) sum += n - (pos + i) + 1;
    const share = sum / players.length;
    for (const pid of players) out.set(pid, share);
  }
  return out;
}

export function winnersOfRound(round: Round): string[] {
  return round.results.filter((r) => r.position === 1).map((r) => r.playerId);
}

export function seasonRounds(rounds: Round[], season: number): Round[] {
  return rounds
    .filter((r) => r.season === season)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

/** Rounds that count for standings/patch (excludes Chiplocked, Legends, etc.) */
function countingRounds(rs: Round[]): Round[] {
  return rs.filter((r) => r.counts !== false);
}

function countingSeasonRounds(rounds: Round[], season: number): Round[] {
  return countingRounds(seasonRounds(rounds, season));
}

export function computeStandings(roster: Player[], rounds: Round[], season: number): PlayerStats[] {
  const rs = countingSeasonRounds(rounds, season);
  const stats = new Map<string, PlayerStats>();
  for (const p of roster) {
    stats.set(p.id, { player: p, roundsPlayed: 0, wins: 0, points: 0, avgFinish: null });
  }
  const finishSum = new Map<string, number>();
  for (const round of rs) {
    const points = pointsForRound(round);
    for (const r of round.results) {
      const s = stats.get(r.playerId);
      if (!s) continue;
      s.roundsPlayed += 1;
      s.points += points.get(r.playerId) ?? 0;
      if (r.position === 1) s.wins += 1;
      finishSum.set(r.playerId, (finishSum.get(r.playerId) ?? 0) + r.position);
    }
  }
  for (const s of stats.values()) {
    if (s.roundsPlayed > 0) s.avgFinish = (finishSum.get(s.player.id) ?? 0) / s.roundsPlayed;
  }
  return [...stats.values()].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.points !== a.points) return b.points - a.points;
    const af = a.avgFinish ?? Infinity;
    const bf = b.avgFinish ?? Infinity;
    if (af !== bf) return af - bf;
    return a.player.name.localeCompare(b.player.name);
  });
}

/**
 * Patch rules:
 *  - Season starts with an initial holder (admin-assigned).
 *  - The patch only passes when the current holder PLAYS a round AND someone else wins.
 *  - If the holder sits out, the patch stays (the round still counts for wins/standings).
 *  - If the holder plays and wins, they defend.
 *  - "Forfeit" is a separate, admin-driven action for when someone stops playing regularly.
 */
export function currentBadgeHolder(
  rounds: Round[],
  season: number,
  initialHolderId: string | null = null
): string | null {
  const rs = countingSeasonRounds(rounds, season);
  let holder: string | null = initialHolderId;
  for (const r of rs) {
    if (!holder) {
      const winner = r.results.find((x) => x.position === 1);
      if (winner) holder = winner.playerId;
      continue;
    }
    const holderPlayed = r.results.some((x) => x.playerId === holder);
    if (!holderPlayed) continue;
    const winner = r.results.find((x) => x.position === 1);
    if (!winner) continue;
    holder = winner.playerId;
  }
  return holder;
}

export function seasonChampion(standings: PlayerStats[]): PlayerStats | null {
  // standings are already sorted by wins DESC; first with rounds played wins.
  return standings.find((s) => s.roundsPlayed > 0) ?? null;
}

export type BadgeEvent = {
  round: Round;
  holderId: string;
  prevHolderId: string | null;
  kind: "first" | "defended" | "stolen" | "no-change";
  winnerId: string;
};

/**
 * Walk the season applying the "patch only passes if holder plays" rule.
 * Emits a row for every round:
 *  - first:       season's initial holder wasn't set; first round's winner claims it
 *  - defended:    holder played AND won
 *  - stolen:      holder played AND someone else won
 *  - no-change:   holder wasn't in the round; round happened but patch stayed
 */
export function badgeTimeline(
  rounds: Round[],
  season: number,
  initialHolderId: string | null = null
): BadgeEvent[] {
  const rs = countingSeasonRounds(rounds, season);
  const events: BadgeEvent[] = [];
  let holder: string | null = initialHolderId;
  for (const round of rs) {
    const winner = round.results.find((r) => r.position === 1)?.playerId ?? null;
    if (!holder) {
      if (winner) {
        events.push({ round, holderId: winner, prevHolderId: null, kind: "first", winnerId: winner });
        holder = winner;
      }
      continue;
    }
    const holderPlayed = round.results.some((x) => x.playerId === holder);
    if (!holderPlayed) {
      events.push({ round, holderId: holder, prevHolderId: holder, kind: "no-change", winnerId: winner ?? holder });
      continue;
    }
    if (!winner) continue;
    if (winner === holder) {
      events.push({ round, holderId: holder, prevHolderId: holder, kind: "defended", winnerId: winner });
    } else {
      events.push({ round, holderId: winner, prevHolderId: holder, kind: "stolen", winnerId: winner });
      holder = winner;
    }
  }
  return events;
}

export function currentStreak(rounds: Round[], season: number, playerId: string): number {
  const rs = [...countingSeasonRounds(rounds, season)].reverse();
  let streak = 0;
  for (const r of rs) {
    const played = r.results.some((x) => x.playerId === playerId);
    if (!played) continue;
    const won = r.results.some((x) => x.playerId === playerId && x.position === 1);
    if (won) streak += 1;
    else break;
  }
  return streak;
}

export function availableSeasons(rounds: Round[], currentSeason: number, historySeasons: number[]): number[] {
  const set = new Set<number>([currentSeason, ...historySeasons]);
  for (const r of rounds) set.add(r.season);
  return [...set].sort((a, b) => b - a);
}

/** Rankings as they stood BEFORE the most recent round of the season. */
export function standingsBeforeLastRound(roster: Player[], rounds: Round[], season: number): PlayerStats[] {
  const rs = seasonRounds(rounds, season);
  if (rs.length === 0) return computeStandings(roster, rounds, season);
  const withoutLast = rounds.filter((r) => r.id !== rs[rs.length - 1].id);
  return computeStandings(roster, withoutLast, season);
}

export type RankDelta = { playerId: string; delta: number | null };

export function rankDeltas(roster: Player[], rounds: Round[], season: number): Map<string, number | null> {
  const now = computeStandings(roster, rounds, season);
  const before = standingsBeforeLastRound(roster, rounds, season);
  const beforeRank = new Map<string, number>();
  before.forEach((s, i) => {
    if (s.roundsPlayed > 0) beforeRank.set(s.player.id, i + 1);
  });
  const out = new Map<string, number | null>();
  now.forEach((s, i) => {
    if (s.roundsPlayed === 0) {
      out.set(s.player.id, null);
      return;
    }
    const prev = beforeRank.get(s.player.id);
    out.set(s.player.id, prev == null ? null : prev - (i + 1));
  });
  return out;
}

/** Per-player season-long longest win streak (contiguous wins across played rounds). */
export function longestStreak(rounds: Round[], season: number, playerId: string): number {
  const rs = countingSeasonRounds(rounds, season);
  let best = 0, cur = 0;
  for (const r of rs) {
    const entry = r.results.find((x) => x.playerId === playerId);
    if (!entry) continue;
    if (entry.position === 1) {
      cur += 1;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  return best;
}

/**
 * Consecutive rounds (defends + no-changes) since the current holder took the patch.
 */
export function badgeHoldStreak(
  rounds: Round[],
  season: number,
  initialHolderId: string | null = null
): number {
  const events = badgeTimeline(rounds, season, initialHolderId);
  if (events.length === 0) return 0;
  let streak = 0;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].kind === "first" || events[i].kind === "stolen") {
      streak += 1;
      break;
    }
    streak += 1;
  }
  return streak;
}

/** Head-to-head across all time — playerId -> opponentId -> { wins, rounds }. */
export function headToHead(rounds: Round[], playerId: string): Map<string, { wins: number; rounds: number; losses: number }> {
  const out = new Map<string, { wins: number; rounds: number; losses: number }>();
  for (const r of countingRounds(rounds)) {
    const mine = r.results.find((x) => x.playerId === playerId);
    if (!mine) continue;
    for (const o of r.results) {
      if (o.playerId === playerId) continue;
      const k = out.get(o.playerId) ?? { wins: 0, rounds: 0, losses: 0 };
      k.rounds += 1;
      if (mine.position < o.position) k.wins += 1;
      else if (mine.position > o.position) k.losses += 1;
      out.set(o.playerId, k);
    }
  }
  return out;
}

/** All-time course records: courseName -> { score, playerId, roundId }. */
export function courseRecords(rounds: Round[]): Map<string, { playerId: string; score: number; roundId: string; date: string }> {
  // We only store totalScore opaque in results, so derive from UDisc scores if present
  // NOTE: results[].position only, not score. Skip until we store scores.
  // Placeholder — return empty map. Callers will render "no data" gracefully.
  return new Map();
}

/** Best (lowest) position a player has achieved per course. */
export function courseLeaders(
  rounds: Round[]
): Map<string, { playerId: string; roundId: string; date: string; rounds: number }> {
  const out = new Map<string, { playerId: string; roundId: string; date: string; rounds: number }>();
  for (const r of rounds) {
    if (!r.courseName) continue;
    const winner = r.results.find((x) => x.position === 1);
    if (!winner) continue;
    const existing = out.get(r.courseName);
    if (!existing) {
      out.set(r.courseName, { playerId: winner.playerId, roundId: r.id, date: r.date, rounds: 1 });
    } else {
      existing.rounds += 1;
      out.set(r.courseName, existing);
    }
  }
  return out;
}

/** Per-player "patch thefts" (rounds where they won and a different player was the prior holder). */
export function patchThefts(rounds: Round[], season?: number): Map<string, number> {
  const counting = countingRounds(rounds);
  const rs = season != null ? seasonRounds(counting, season) : [...counting].sort((a, b) => a.date.localeCompare(b.date));
  const out = new Map<string, number>();
  let prev: string | null = null;
  for (const r of rs) {
    const w = r.results.find((x) => x.position === 1)?.playerId;
    if (!w) continue;
    if (prev && w !== prev) out.set(w, (out.get(w) ?? 0) + 1);
    prev = w;
  }
  return out;
}

/** Longest back-to-back wins streak any player has ever had in a season. */
export function allTimeLongestStreak(rounds: Round[], playerId: string): number {
  const seasons = new Set(rounds.map((r) => r.season));
  let best = 0;
  for (const s of seasons) {
    const l = longestStreak(rounds, s, playerId);
    if (l > best) best = l;
  }
  return best;
}

/** Rounds grouped by YYYY-MM for activity charts. */
export function roundsByMonth(rounds: Round[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of rounds) {
    const ym = r.date.slice(0, 7);
    out.set(ym, (out.get(ym) ?? 0) + 1);
  }
  return new Map([...out.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

/** "Last 5" form per player across all rounds, as ordered list of (W|T|L). */
export function recentForm(rounds: Round[], playerId: string, n = 5): ("W" | "T" | "L")[] {
  const rs = countingRounds(rounds)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
    .filter((r) => r.results.some((x) => x.playerId === playerId))
    .slice(-n);
  return rs.map((r) => {
    const me = r.results.find((x) => x.playerId === playerId)!;
    const tiedFirst = r.results.filter((x) => x.position === 1).length > 1;
    if (me.position === 1 && tiedFirst) return "T";
    if (me.position === 1) return "W";
    return "L";
  });
}
