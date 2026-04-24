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

export function computeStandings(roster: Player[], rounds: Round[], season: number): PlayerStats[] {
  const rs = seasonRounds(rounds, season);
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
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.player.name.localeCompare(b.player.name);
  });
}

/**
 * Badge rules:
 *  - Season starts with an "initial holder" (picked however the group wants — random, prior champion, etc.)
 *  - Badge only transfers when the current holder PLAYS that round and someone else wins.
 *  - If the holder sits out, the badge stays with them (even if someone else wins that round's points).
 *  - If the holder plays and wins, they defend.
 */
export function currentBadgeHolder(
  rounds: Round[],
  season: number,
  initialHolderId: string | null = null
): string | null {
  const rs = seasonRounds(rounds, season);
  let holder: string | null = initialHolderId;
  for (const r of rs) {
    if (!holder) {
      // No initial holder → first winner of the season claims it
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
  const played = standings.filter((s) => s.roundsPlayed > 0);
  if (played.length === 0) return null;
  const sorted = [...played].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.points !== a.points) return b.points - a.points;
    const af = a.avgFinish ?? Infinity;
    const bf = b.avgFinish ?? Infinity;
    return af - bf;
  });
  return sorted[0];
}

export type BadgeEvent = {
  round: Round;
  holderId: string;
  prevHolderId: string | null;
  kind: "first" | "defended" | "stolen" | "no-change";
};

/**
 * Walk the season's rounds applying the "badge only passes if holder plays" rule.
 * Emits an event for every round, even "no-change" ones, so you can see what happened.
 */
export function badgeTimeline(
  rounds: Round[],
  season: number,
  initialHolderId: string | null = null
): BadgeEvent[] {
  const rs = seasonRounds(rounds, season);
  const events: BadgeEvent[] = [];
  let holder: string | null = initialHolderId;
  for (const round of rs) {
    const winner = round.results.find((r) => r.position === 1)?.playerId ?? null;
    if (!holder) {
      if (winner) {
        events.push({ round, holderId: winner, prevHolderId: null, kind: "first" });
        holder = winner;
      }
      continue;
    }
    const holderPlayed = round.results.some((x) => x.playerId === holder);
    if (!holderPlayed) {
      events.push({ round, holderId: holder, prevHolderId: holder, kind: "no-change" });
      continue;
    }
    if (!winner) continue;
    if (winner === holder) {
      events.push({ round, holderId: holder, prevHolderId: holder, kind: "defended" });
    } else {
      events.push({ round, holderId: winner, prevHolderId: holder, kind: "stolen" });
      holder = winner;
    }
  }
  return events;
}

export function currentStreak(rounds: Round[], season: number, playerId: string): number {
  const rs = [...seasonRounds(rounds, season)].reverse();
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
  const rs = seasonRounds(rounds, season);
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
 * How many consecutive rounds has the current badge holder held the badge?
 * Counts every round since they received it (including no-change rounds they sat out).
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
    if (events[i].kind === "stolen" || events[i].kind === "first") {
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
  for (const r of rounds) {
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
      // Keep the earliest record as the "holder" — most recent wins don't overwrite
      out.set(r.courseName, existing);
    }
  }
  return out;
}
