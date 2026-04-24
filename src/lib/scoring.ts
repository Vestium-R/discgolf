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

export function currentBadgeHolder(rounds: Round[], season: number): string | null {
  const rs = seasonRounds(rounds, season);
  if (rs.length === 0) return null;
  const last = rs[rs.length - 1];
  return winnersOfRound(last)[0] ?? null;
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
  stolen: boolean;
};

/**
 * Walk the season's rounds to build a badge-passing timeline.
 * The badge transfers to the winner of each round; "stolen" when the
 * previous holder played and lost, "changed" when they didn't play.
 */
export function badgeTimeline(rounds: Round[], season: number): BadgeEvent[] {
  const rs = seasonRounds(rounds, season);
  const events: BadgeEvent[] = [];
  let prev: string | null = null;
  for (const round of rs) {
    const winners = winnersOfRound(round);
    if (winners.length === 0) continue;
    const holder = winners[0];
    const played = round.results.some((r) => r.playerId === prev);
    const stolen = prev != null && played && holder !== prev;
    events.push({ round, holderId: holder, prevHolderId: prev, stolen: !!stolen });
    prev = holder;
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
