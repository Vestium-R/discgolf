import Link from "next/link";
import { notFound } from "next/navigation";
import { getHistory, getRoster, getRounds, getSettings } from "@/lib/store";
import {
  availableSeasons,
  computeStandings,
  currentStreak,
  headToHead,
  longestStreak,
  pointsForRound,
  seasonRounds,
} from "@/lib/scoring";
import { fmtPoints, prettyDate, ordinal } from "@/lib/format";
import { BadgeCrown, MedalBadge } from "@/components/BadgeCrown";
import { Avatar } from "@/components/Avatar";
import { SeasonPicker } from "@/components/SeasonPicker";

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { id } = await params;
  const { season: seasonParam } = await searchParams;
  const [roster, rounds, settings, history] = await Promise.all([
    getRoster(),
    getRounds(),
    getSettings(),
    getHistory(),
  ]);
  const player = roster.find((p) => p.id === id);
  if (!player) notFound();

  const season = Number(seasonParam) || settings.currentSeason;
  const badgeImage = history.find((h) => h.season === season)?.badgeImageUrl;
  const seasons = availableSeasons(rounds, settings.currentSeason, history.map((h) => h.season));
  const standings = computeStandings(roster, rounds, season);
  const me = standings.find((s) => s.player.id === id);
  const rank = standings.findIndex((s) => s.player.id === id) + 1;
  const streak = currentStreak(rounds, season, id);
  const longest = longestStreak(rounds, season, id);

  const seasonList = seasonRounds(rounds, season);
  const mine = seasonList
    .map((r) => {
      const entry = r.results.find((x) => x.playerId === id);
      if (!entry) return null;
      const pts = pointsForRound(r).get(id) ?? 0;
      return { round: r, pos: entry.position, pts, N: r.results.length };
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .reverse();

  const podiums = mine.filter((x) => x.pos <= 3).length;
  const bestFinish = mine.length > 0 ? Math.min(...mine.map((x) => x.pos)) : null;
  const h2h = headToHead(rounds, id);
  const h2hRows = [...h2h.entries()]
    .map(([pid, stats]) => ({ opponent: roster.find((p) => p.id === pid), ...stats }))
    .filter((r) => r.opponent && r.rounds > 0)
    .sort((a, b) => b.rounds - a.rounds);

  // Only completed seasons count as championships — the current season
  // isn't over yet, so even if a champion has been provisionally set it
  // shouldn't show on the profile.
  const seasonsChamped = history.filter(
    (h) => h.championPlayerId === id && h.season < settings.currentSeason,
  );

  // Personal records across all time.
  // Best round: lowest relativeScore (most under par). Tiebreak by earliest date.
  let bestRound: { relativeScore: number; score?: number; roundId: string; date: string; courseName?: string } | null = null;
  const firstWin: { date: string; roundId: string; courseName?: string } | null = (() => {
    for (const r of [...rounds].sort((a, b) => a.date.localeCompare(b.date))) {
      const mine = r.results.find((x) => x.playerId === id);
      if (mine && mine.position === 1) return { date: r.date, roundId: r.id, courseName: r.courseName };
    }
    return null;
  })();
  for (const r of rounds) {
    const mine = r.results.find((x) => x.playerId === id);
    if (!mine || mine.relativeScore == null) continue;
    if (bestRound == null || mine.relativeScore < bestRound.relativeScore) {
      bestRound = {
        relativeScore: mine.relativeScore,
        score: mine.score,
        roundId: r.id,
        date: r.date,
        courseName: r.courseName,
      };
    }
  }
  // Longest win streak at a specific course: contiguous wins at same courseName.
  const courseStreak: { courseName: string; count: number } | null = (() => {
    const byCourse = new Map<string, { count: number; current: number }>();
    for (const r of [...rounds].sort((a, b) => a.date.localeCompare(b.date))) {
      if (!r.courseName) continue;
      const mine = r.results.find((x) => x.playerId === id);
      if (!mine) continue;
      const entry = byCourse.get(r.courseName) ?? { count: 0, current: 0 };
      if (mine.position === 1) entry.current += 1;
      else entry.current = 0;
      if (entry.current > entry.count) entry.count = entry.current;
      byCourse.set(r.courseName, entry);
    }
    let best: { courseName: string; count: number } | null = null;
    for (const [c, v] of byCourse) {
      if (v.count >= 2 && (!best || v.count > best.count)) best = { courseName: c, count: v.count };
    }
    return best;
  })();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-forest-600 hover:underline">← Home</Link>
        <SeasonPicker seasons={seasons} active={season} base={`/players/${id}?season=`} />
      </div>

      <header className="card p-5">
        <div className="flex items-center gap-4">
          <Avatar playerId={player.id} name={player.name} size="lg" imageUrl={player.udiscAvatarUrl} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-2xl font-bold text-forest-800">{player.name}</h2>
              {streak >= 2 && (
                <span className="text-xs font-semibold rounded-full bg-orange-100 text-orange-800 px-2 py-0.5">
                  🔥 {streak} in a row
                </span>
              )}
              {seasonsChamped.length > 0 && (
                <span className="text-xs font-semibold rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
                  👑 {seasonsChamped.length}× champion
                </span>
              )}
              {rank === 1 && me && me.roundsPlayed > 0 && season === settings.currentSeason && (
                <span className="text-xs font-semibold rounded-full bg-forest-100 text-forest-800 px-2 py-0.5">
                  🏁 Leading {settings.currentSeason}
                </span>
              )}
            </div>
            {player.udiscHandle && (
              <a
                href={`https://udisc.com/users/${player.udiscHandle}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-forest-600 hover:underline"
              >
                @{player.udiscHandle}
              </a>
            )}
          </div>
          {rank === 1 && me && me.roundsPlayed > 0 && (
            <BadgeCrown size="md" imageUrl={badgeImage} />
          )}
        </div>
        {me && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
            <Stat label="Rank" value={rank ? ordinal(rank) : "—"} />
            <Stat label="Points" value={fmtPoints(me.points)} />
            <Stat label="Wins" value={String(me.wins)} />
            <Stat label="Podiums" value={String(podiums)} />
            <Stat label="Best" value={bestFinish ? ordinal(bestFinish) : "—"} />
            <Stat label="Streak" value={longest > 0 ? `${longest}` : "—"} />
          </div>
        )}
        {seasonsChamped.length > 0 && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-amber-900">
                {seasonsChamped.length === 1 ? "Season champion" : `${seasonsChamped.length}× season champion`}
              </div>
              <div className="text-sm text-amber-800">
                {seasonsChamped.map((h, i) => (
                  <span key={h.season}>
                    <Link href={`/seasons/${h.season}`} className="font-semibold underline">{h.season}</Link>
                    {i < seasonsChamped.length - 1 ? " · " : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {(bestRound || firstWin || courseStreak) && (
        <section className="card p-4">
          <h3 className="font-display font-bold text-forest-800 mb-3">Personal records</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {bestRound && (
              <Link href={`/rounds/${bestRound.roundId}`} className="rounded-xl border border-forest-100 bg-forest-50 p-3 hover:border-forest-300 transition">
                <div className="text-xs uppercase tracking-wide text-forest-600">Best round</div>
                <div className="text-2xl font-bold tabular-nums text-forest-800">
                  {bestRound.relativeScore > 0 ? "+" : ""}{bestRound.relativeScore}
                  {bestRound.score != null && <span className="text-lg text-forest-600"> ({bestRound.score})</span>}
                </div>
                <div className="text-xs text-forest-600 truncate">{bestRound.courseName ?? "—"} · {prettyDate(bestRound.date)}</div>
              </Link>
            )}
            {courseStreak && (
              <div className="rounded-xl border border-forest-100 bg-forest-50 p-3">
                <div className="text-xs uppercase tracking-wide text-forest-600">Course streak</div>
                <div className="text-2xl font-bold tabular-nums text-forest-800">
                  {courseStreak.count} <span className="text-lg text-forest-600">wins</span>
                </div>
                <div className="text-xs text-forest-600 truncate">{courseStreak.courseName}</div>
              </div>
            )}
            {firstWin && (
              <Link href={`/rounds/${firstWin.roundId}`} className="rounded-xl border border-forest-100 bg-forest-50 p-3 hover:border-forest-300 transition">
                <div className="text-xs uppercase tracking-wide text-forest-600">First win</div>
                <div className="text-2xl font-bold text-forest-800">🏆</div>
                <div className="text-xs text-forest-600 truncate">{firstWin.courseName ?? "—"} · {prettyDate(firstWin.date)}</div>
              </Link>
            )}
          </div>
        </section>
      )}

      <section>
        <h3 className="font-display font-bold text-forest-800 mb-2">Rounds in {season}</h3>
        {mine.length === 0 ? (
          <div className="card p-4 text-sm text-forest-600">No rounds yet this season.</div>
        ) : (
          <ul className="space-y-2">
            {mine.map(({ round, pos, pts, N }) => (
              <li key={round.id}>
                <Link href={`/rounds/${round.id}`} className="block card p-3 hover:border-forest-300 transition">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <MedalBadge position={pos} />
                      <div className="min-w-0">
                        <div className="font-medium text-forest-800 truncate">
                          {prettyDate(round.date)}
                          {round.courseName ? ` — ${round.courseName}` : ""}
                        </div>
                        <div className="text-xs text-forest-600">
                          {ordinal(pos)} of {N} · +{fmtPoints(pts)} pts
                        </div>
                      </div>
                    </div>
                    {pos === 1 && <BadgeCrown size="xs" imageUrl={badgeImage} />}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {h2hRows.length > 0 && (
        <section className="card p-4">
          <h3 className="font-display font-bold text-forest-800 mb-2">Head-to-head (all time)</h3>
          <ul className="divide-y divide-forest-100">
            {h2hRows.map((r) => {
              const pct = r.rounds > 0 ? Math.round((r.wins / r.rounds) * 100) : 0;
              return (
                <li key={r.opponent!.id} className="py-2 flex items-center gap-3">
                  <Avatar playerId={r.opponent!.id} name={r.opponent!.name} size="sm" imageUrl={r.opponent!.udiscAvatarUrl} />
                  <Link href={`/players/${r.opponent!.id}`} className="flex-1 text-sm text-forest-800 hover:underline truncate">
                    {r.opponent!.name}
                  </Link>
                  <div className="flex-1 h-2 rounded-full bg-forest-100 overflow-hidden max-w-32">
                    <div
                      className="h-full bg-forest-600"
                      style={{ width: `${pct}%` }}
                      title={`${pct}% wins vs ${r.opponent!.name}`}
                    />
                  </div>
                  <div className="text-xs tabular-nums w-20 text-right text-forest-700">
                    {r.wins}W-{r.losses}L · {pct}%
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-forest-50 p-3">
      <div className="text-xs text-forest-600 uppercase tracking-wide">{label}</div>
      <div className="text-xl font-bold text-forest-800 font-display">{value}</div>
    </div>
  );
}
