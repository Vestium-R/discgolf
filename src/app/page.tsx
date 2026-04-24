import Link from "next/link";
import { getHistory, getRoster, getRounds, getSettings } from "@/lib/store";
import {
  availableSeasons,
  badgeTimeline,
  computeStandings,
  currentBadgeHolder,
  seasonRounds,
} from "@/lib/scoring";
import { BadgeCrown, MedalBadge } from "@/components/BadgeCrown";
import { PasteUdiscBox } from "@/components/PasteUdiscBox";
import { SeasonPicker } from "@/components/SeasonPicker";
import { fmtPoints, prettyDate } from "@/lib/format";

export default async function HomePage() {
  const [roster, rounds, settings, history] = await Promise.all([
    getRoster(),
    getRounds(),
    getSettings(),
    getHistory(),
  ]);
  const season = settings.currentSeason;
  const seasons = availableSeasons(
    rounds,
    season,
    history.map((h) => h.season)
  );
  const standings = computeStandings(roster, rounds, season);
  const badgeId = currentBadgeHolder(rounds, season);
  const badgeHolder = badgeId ? roster.find((p) => p.id === badgeId) : null;
  const rs = seasonRounds(rounds, season);
  const last = rs.at(-1);
  const timeline = badgeTimeline(rounds, season).slice(-5).reverse();
  const priorChamp = history.find((h) => h.season === season - 1);

  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="hero-gradient rounded-3xl p-6 sm:p-10 text-white shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <span className="text-xs uppercase tracking-widest opacity-80">Season {season} · Current badge</span>
          <SeasonPicker seasons={seasons} active={season} />
        </div>
        {badgeHolder ? (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <BadgeCrown size="xl" glow />
            <div className="text-center sm:text-left">
              <Link
                href={`/players/${badgeHolder.id}`}
                className="block text-4xl sm:text-5xl font-bold font-display hover:underline"
              >
                {badgeHolder.name}
              </Link>
              {last && (
                <p className="mt-2 text-sm opacity-90">
                  Won {prettyDate(last.date)}
                  {last.courseName ? ` at ${last.courseName}` : ""} · {last.results.length} playing
                </p>
              )}
              {priorChamp && (
                <p className="mt-1 text-xs opacity-70">
                  {season - 1} champion: {priorChamp.championName}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-lg opacity-90">The badge is up for grabs.</p>
            <p className="text-sm opacity-70 mt-1">Add the first round below to start the season.</p>
          </div>
        )}
      </section>

      {/* ADD ROUND */}
      <section className="card p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-forest-800">Add a round</h2>
            <p className="text-sm text-forest-600">Anyone can paste a UDisc scorecard link. We&apos;ll grab everyone who played.</p>
          </div>
          <Link href="/add" className="text-xs text-forest-600 hover:underline hidden sm:block">
            Manual entry →
          </Link>
        </div>
        <PasteUdiscBox action="/api/preview" />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* STANDINGS */}
        <section className="lg:col-span-3 card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-forest-100">
            <h2 className="font-display font-bold text-forest-800">Standings</h2>
            <span className="text-xs text-forest-600">Season {season}</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-forest-50 text-forest-700">
              <tr>
                <th className="py-2 px-3 text-left w-12">#</th>
                <th className="py-2 px-3 text-left">Player</th>
                <th className="py-2 px-3 text-right">Pts</th>
                <th className="py-2 px-3 text-right hidden sm:table-cell">W</th>
                <th className="py-2 px-3 text-right hidden sm:table-cell">Rds</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => {
                const isBadge = s.player.id === badgeId;
                const rank = i + 1;
                const dim = s.roundsPlayed === 0 ? "text-forest-400" : "";
                return (
                  <tr
                    key={s.player.id}
                    className={`border-t border-forest-100 ${isBadge ? "bg-amber-50/40" : ""}`}
                  >
                    <td className="py-2 px-3">
                      {s.roundsPlayed > 0 ? <MedalBadge position={rank} /> : <span className="text-forest-400 text-xs">{rank}</span>}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        {isBadge && <BadgeCrown size="xs" />}
                        <Link href={`/players/${s.player.id}`} className={`hover:underline ${dim}`}>
                          {s.player.name}
                        </Link>
                      </div>
                    </td>
                    <td className={`py-2 px-3 text-right font-semibold tabular-nums ${dim}`}>{fmtPoints(s.points)}</td>
                    <td className={`py-2 px-3 text-right tabular-nums hidden sm:table-cell ${dim}`}>{s.wins}</td>
                    <td className={`py-2 px-3 text-right tabular-nums hidden sm:table-cell ${dim}`}>{s.roundsPlayed}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-xs text-forest-500 p-3 border-t border-forest-100">
            Points per round: N − position + 1. Ties split the pot.
          </p>
        </section>

        {/* BADGE TIMELINE */}
        <section className="lg:col-span-2 card p-4">
          <h2 className="font-display font-bold text-forest-800 mb-3">Badge passes</h2>
          {timeline.length === 0 ? (
            <p className="text-sm text-forest-600">No rounds yet this season.</p>
          ) : (
            <ol className="space-y-3">
              {timeline.map((t, i) => {
                const holder = roster.find((p) => p.id === t.holderId);
                const prev = t.prevHolderId ? roster.find((p) => p.id === t.prevHolderId) : null;
                return (
                  <li key={t.round.id + i} className="flex items-start gap-3">
                    <BadgeCrown size="sm" />
                    <div className="flex-1 min-w-0">
                      <Link href={`/rounds/${t.round.id}`} className="block">
                        <div className="text-sm font-semibold text-forest-800 hover:underline">
                          {holder?.name ?? t.holderId}
                        </div>
                        <div className="text-xs text-forest-600">
                          {prev && t.stolen ? (
                            <>Stole from <strong>{prev.name}</strong></>
                          ) : prev && !t.stolen && t.prevHolderId !== t.holderId ? (
                            <>Took over ({prev.name} didn&apos;t play)</>
                          ) : prev && t.prevHolderId === t.holderId ? (
                            "Defended"
                          ) : (
                            "First of the season"
                          )}
                          {" · "}
                          {prettyDate(t.round.date)}
                        </div>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {timeline.length > 0 && (
            <Link
              href="/rounds"
              className="mt-3 inline-block text-xs text-forest-600 hover:underline"
            >
              All rounds →
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
