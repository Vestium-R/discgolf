import type { Player, PlayerStats, Round } from "./types";

/**
 * N - position + 1 with ties splitting points.
 * Example (5 players, tied 1st): both get avg of points for pos 1 and 2 = (5+4)/2 = 4.5
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
    for (let i = 0; i < players.length; i++) {
      sum += n - (pos + i) + 1;
    }
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
    if (s.roundsPlayed > 0) {
      s.avgFinish = (finishSum.get(s.player.id) ?? 0) / s.roundsPlayed;
    }
  }
  return [...stats.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.player.name.localeCompare(b.player.name);
  });
}

/** Current "currently" badge holder: winner of most recent round of the season. */
export function currentBadgeHolder(rounds: Round[], season: number): string | null {
  const rs = seasonRounds(rounds, season);
  if (rs.length === 0) return null;
  const last = rs[rs.length - 1];
  const winners = winnersOfRound(last);
  return winners[0] ?? null;
}

/** End-of-season champion: most wins. Ties broken by points, then avg finish. */
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
