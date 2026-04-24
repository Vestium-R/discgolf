import Link from "next/link";
import { getRoster, getRounds, getSettings, getHistory } from "@/lib/store";
import { computeStandings, currentBadgeHolder, seasonRounds } from "@/lib/scoring";
import { BadgeCrown } from "@/components/BadgeCrown";
import { fmtPoints, prettyDate } from "@/lib/format";

export default async function HomePage() {
  const [roster, rounds, settings, history] = await Promise.all([
    getRoster(),
    getRounds(),
    getSettings(),
    getHistory(),
  ]);
  const season = settings.currentSeason;
  const standings = computeStandings(roster, rounds, season);
  const badgeId = currentBadgeHolder(rounds, season);
  const badgeHolder = badgeId ? roster.find((p) => p.id === badgeId) : null;
  const last = seasonRounds(rounds, season).at(-1);
  const priorChampion = history.find((h) => h.season === season - 1);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm border border-forest-100">
        <h2 className="text-sm font-semibold text-forest-600 uppercase tracking-wide">
          Season {season} — badge holder
        </h2>
        {badgeHolder ? (
          <div className="mt-2 flex items-center gap-3">
            <BadgeCrown size="lg" />
            <div>
              <Link href={`/players/${badgeHolder.id}`} className="text-2xl font-bold text-forest-800 hover:underline">
                {badgeHolder.name}
              </Link>
              {last && (
                <div className="text-sm text-forest-600">
                  Won {prettyDate(last.date)}
                  {last.courseName ? ` at ${last.courseName}` : ""}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-forest-700">
            No rounds played yet this season.{" "}
            <Link className="text-forest-600 underline" href="/admin/rounds/new">
              Add the first one
            </Link>
            .
          </p>
        )}
        {priorChampion && (
          <p className="mt-3 text-xs text-forest-600">
            {priorChampion.season} season champion: <strong>{priorChampion.championName}</strong>
            {priorChampion.note ? ` — ${priorChampion.note}` : ""}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-forest-600 uppercase tracking-wide mb-2">Standings</h2>
        <div className="overflow-hidden rounded-2xl border border-forest-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-forest-50 text-forest-700">
              <tr>
                <th className="py-2 px-3 text-left">#</th>
                <th className="py-2 px-3 text-left">Player</th>
                <th className="py-2 px-3 text-right">Pts</th>
                <th className="py-2 px-3 text-right">Wins</th>
                <th className="py-2 px-3 text-right">Rds</th>
                <th className="py-2 px-3 text-right">Avg</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => {
                const isBadge = s.player.id === badgeId;
                const dim = s.roundsPlayed === 0 ? "text-forest-400" : "";
                return (
                  <tr key={s.player.id} className="border-t border-forest-100">
                    <td className={`py-2 px-3 ${dim}`}>{i + 1}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        {isBadge && <BadgeCrown size="sm" />}
                        <Link href={`/players/${s.player.id}`} className={`hover:underline ${dim}`}>
                          {s.player.name}
                        </Link>
                      </div>
                    </td>
                    <td className={`py-2 px-3 text-right font-semibold ${dim}`}>{fmtPoints(s.points)}</td>
                    <td className={`py-2 px-3 text-right ${dim}`}>{s.wins}</td>
                    <td className={`py-2 px-3 text-right ${dim}`}>{s.roundsPlayed}</td>
                    <td className={`py-2 px-3 text-right ${dim}`}>
                      {s.avgFinish == null ? "—" : s.avgFinish.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-forest-600 mt-2">
          Scoring: each round awards (N − position + 1) points where N is the number of players. Ties split points.
        </p>
      </section>
    </div>
  );
}
