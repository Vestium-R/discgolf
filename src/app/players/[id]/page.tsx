import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoster, getRounds, getSettings } from "@/lib/store";
import {
  availableSeasons,
  computeStandings,
  currentStreak,
  pointsForRound,
  seasonRounds,
} from "@/lib/scoring";
import { fmtPoints, prettyDate, ordinal } from "@/lib/format";
import { BadgeCrown, MedalBadge } from "@/components/BadgeCrown";
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
  const [roster, rounds, settings] = await Promise.all([getRoster(), getRounds(), getSettings()]);
  const player = roster.find((p) => p.id === id);
  if (!player) notFound();

  const season = Number(seasonParam) || settings.currentSeason;
  const seasons = availableSeasons(rounds, settings.currentSeason, []);
  const standings = computeStandings(roster, rounds, season);
  const me = standings.find((s) => s.player.id === id);
  const rank = standings.findIndex((s) => s.player.id === id) + 1;
  const streak = currentStreak(rounds, season, id);

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-forest-600 hover:underline">← Home</Link>
        <SeasonPicker seasons={seasons} active={season} base={`/players/${id}?season=`} />
      </div>

      <header className="card p-5">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-bold text-forest-800">{player.name}</h2>
          {streak > 0 && (
            <span className="text-xs font-semibold rounded-full bg-orange-100 text-orange-800 px-2 py-0.5">
              🔥 {streak} win{streak === 1 ? "" : "s"} in a row
            </span>
          )}
        </div>
        {player.udiscHandle && (
          <p className="text-sm text-forest-600">@{player.udiscHandle}</p>
        )}
        {me && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Stat label="Rank" value={rank ? ordinal(rank) : "—"} />
            <Stat label="Points" value={fmtPoints(me.points)} />
            <Stat label="Wins" value={String(me.wins)} />
            <Stat label="Podiums" value={String(podiums)} />
            <Stat label="Best" value={bestFinish ? ordinal(bestFinish) : "—"} />
          </div>
        )}
      </header>

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
                    {pos === 1 && <BadgeCrown size="xs" />}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
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
