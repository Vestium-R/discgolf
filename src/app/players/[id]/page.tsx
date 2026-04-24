import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoster, getRounds, getSettings } from "@/lib/store";
import { computeStandings, pointsForRound, seasonRounds } from "@/lib/scoring";
import { fmtPoints, prettyDate, ordinal } from "@/lib/format";
import { BadgeCrown } from "@/components/BadgeCrown";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [roster, rounds, settings] = await Promise.all([getRoster(), getRounds(), getSettings()]);
  const player = roster.find((p) => p.id === id);
  if (!player) notFound();

  const season = settings.currentSeason;
  const standings = computeStandings(roster, rounds, season);
  const me = standings.find((s) => s.player.id === id);
  const rank = standings.findIndex((s) => s.player.id === id) + 1;

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

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-forest-600 hover:underline">← Standings</Link>
      <header className="rounded-2xl border border-forest-100 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-forest-800">{player.name}</h2>
        {player.udiscHandle && (
          <p className="text-sm text-forest-600">UDisc: {player.udiscHandle}</p>
        )}
        {me && (
          <div className="mt-3 grid grid-cols-4 gap-3 text-center">
            <Stat label="Rank" value={rank ? ordinal(rank) : "—"} />
            <Stat label="Points" value={fmtPoints(me.points)} />
            <Stat label="Wins" value={String(me.wins)} />
            <Stat label="Rounds" value={String(me.roundsPlayed)} />
          </div>
        )}
      </header>

      <section>
        <h3 className="text-sm font-semibold text-forest-700 mb-2">Rounds this season</h3>
        {mine.length === 0 && <p className="text-forest-600 text-sm">No rounds yet.</p>}
        <ul className="space-y-2">
          {mine.map(({ round, pos, pts, N }) => (
            <li key={round.id}>
              <Link
                href={`/rounds/${round.id}`}
                className="block rounded-xl border border-forest-100 bg-white p-3 shadow-sm hover:border-forest-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-forest-800">
                      {prettyDate(round.date)}
                      {round.courseName ? ` — ${round.courseName}` : ""}
                    </div>
                    <div className="text-xs text-forest-600">
                      {ordinal(pos)} of {N} · +{fmtPoints(pts)} pts
                    </div>
                  </div>
                  {pos === 1 && <BadgeCrown size="sm" />}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-forest-50 p-3">
      <div className="text-xs text-forest-600 uppercase tracking-wide">{label}</div>
      <div className="text-xl font-bold text-forest-800">{value}</div>
    </div>
  );
}
