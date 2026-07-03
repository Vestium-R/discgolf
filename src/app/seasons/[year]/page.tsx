import Link from "next/link";
import { notFound } from "next/navigation";
import { getHistory, getPatchTransfers, getRoster, getRounds, getSettings } from "@/lib/store";
import {
  availableSeasons,
  badgeTimeline,
  computeStandings,
  currentBadgeHolder,
  seasonChampion,
  seasonRounds,
} from "@/lib/scoring";

const kindLabel = (k: "first" | "defended" | "stolen" | "no-change" | "transfer") =>
  k === "stolen" ? "🗡 Stole the patch" :
  k === "defended" ? "🛡 Defended" :
  k === "transfer" ? "↔ Admin transfer" :
  k === "no-change" ? "💤 Patch stayed (holder sat out)" :
  "🥏 First of the season";
import { BadgeCrown, MedalBadge } from "@/components/BadgeCrown";
import { Avatar } from "@/components/Avatar";
import { SeasonPicker } from "@/components/SeasonPicker";
import { fmtPoints, prettyDate } from "@/lib/format";

export default async function SeasonPage({
  params,
  searchParams,
}: {
  params: Promise<{ year: string }>;
  searchParams: Promise<{ layout?: string }>;
}) {
  const { year: yearStr } = await params;
  const year = Number(yearStr);
  if (!Number.isFinite(year)) notFound();
  const { layout: layoutFilter } = await searchParams;

  const [roster, rounds, settings, history, transfers] = await Promise.all([
    getRoster(),
    getRounds(),
    getSettings(),
    getHistory(),
    getPatchTransfers(),
  ]);
  const seasons = availableSeasons(rounds, settings.currentSeason, history.map((h) => h.season));
  const rsAll = seasonRounds(rounds, year);
  const courseOptions = [...new Set(rsAll.map((r) => r.courseName).filter((x): x is string => !!x))].sort();
  const filteredRounds = layoutFilter
    ? rounds.filter((r) => r.courseName === layoutFilter)
    : rounds;
  const rs = seasonRounds(filteredRounds, year);
  // Past seasons: show everyone who played. Current season: filter to active or already-played
  // so retired names don't clutter an in-progress standings board.
  const standings = computeStandings(roster, filteredRounds, year).filter(
    (s) => s.roundsPlayed > 0 || (year === settings.currentSeason && s.player.active && !layoutFilter),
  );
  const isCurrent = year === settings.currentSeason;
  const rec = history.find((h) => h.season === year);
  const initial = rec?.initialBadgeHolderPlayerId ?? null;
  const champ = isCurrent ? null : seasonChampion(standings);
  const badgeId = isCurrent
    ? currentBadgeHolder(filteredRounds, year, initial, transfers)
    : rec?.championPlayerId ?? champ?.player.id ?? null;
  const badgeHolder = badgeId ? roster.find((p) => p.id === badgeId) : null;
  const paceLeader = isCurrent ? seasonChampion(standings) : null;
  const paceLeaderDifferent = paceLeader && paceLeader.player.id !== badgeId;
  const timeline = badgeTimeline(filteredRounds, year, initial, transfers).reverse();
  const badgeImage = rec?.badgeImageUrl;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-bold text-forest-800">Season {year}</h2>
          <p className="text-sm text-forest-600">
            {rs.length} round{rs.length === 1 ? "" : "s"}{isCurrent ? " · in progress" : ""}
            {layoutFilter && <span> · filtered</span>}
          </p>
        </div>
        <SeasonPicker seasons={seasons} active={year} />
      </header>

      {layoutFilter && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 flex items-center gap-3 text-sm">
          <span>🔍</span>
          <span className="flex-1 min-w-0">
            Showing only <strong className="text-amber-900">{layoutFilter}</strong>
          </span>
          <Link
            href={`/seasons/${year}`}
            className="text-xs font-semibold text-amber-900 hover:underline whitespace-nowrap"
          >
            Clear filter ✕
          </Link>
        </div>
      )}

      {courseOptions.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-forest-600">Layout:</span>
          <Link
            href={`/seasons/${year}`}
            className={`rounded-full px-3 py-1 ${!layoutFilter ? "bg-forest-700 text-white" : "bg-forest-50 text-forest-700 hover:bg-forest-100"}`}
          >
            All
          </Link>
          {courseOptions.map((c) => (
            <Link
              key={c}
              href={`/seasons/${year}?layout=${encodeURIComponent(c)}`}
              className={`rounded-full px-3 py-1 ${layoutFilter === c ? "bg-forest-700 text-white" : "bg-forest-50 text-forest-700 hover:bg-forest-100"}`}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {(badgeHolder || badgeImage || paceLeader) && (
        <div className={`grid gap-4 ${isCurrent && paceLeaderDifferent ? "sm:grid-cols-2" : ""}`}>
          {(badgeHolder || badgeImage) && (
            <section className="hero-gradient rounded-3xl p-6 text-white flex items-center gap-5">
              <BadgeCrown size="lg" glow={isCurrent} imageUrl={badgeImage} />
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-widest opacity-80">
                  {isCurrent ? "🧥 Currently holds" : "👑 Season champion"}
                </div>
                {badgeHolder ? (
                  <Link
                    href={`/players/${badgeHolder.id}`}
                    className="font-display text-3xl font-bold hover:underline"
                  >
                    {badgeHolder.name}
                  </Link>
                ) : (
                  <div className="font-display text-2xl font-bold opacity-80">TBD</div>
                )}
                {rec?.note && <p className="text-xs opacity-75 mt-1 italic">{rec.note}</p>}
              </div>
            </section>
          )}
          {isCurrent && paceLeader && paceLeaderDifferent && (
            <section className="rounded-3xl p-6 bg-forest-50 border border-forest-200 flex items-center gap-5">
              <Avatar playerId={paceLeader.player.id} name={paceLeader.player.name} size="lg" imageUrl={paceLeader.player.udiscAvatarUrl} />
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-widest text-forest-700">🏁 On pace</div>
                <Link
                  href={`/players/${paceLeader.player.id}?season=${year}`}
                  className="font-display text-3xl font-bold text-forest-800 hover:underline block truncate"
                >
                  {paceLeader.player.name}
                </Link>
                <div className="text-xs text-forest-600 mt-1">
                  {fmtPoints(paceLeader.points)} pts · {paceLeader.wins} win{paceLeader.wins === 1 ? "" : "s"} · {paceLeader.roundsPlayed} round{paceLeader.roundsPlayed === 1 ? "" : "s"}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3 card overflow-hidden">
          <div className="p-4 border-b border-forest-100">
            <h3 className="font-display font-bold text-forest-800">Standings</h3>
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
                const rank = i + 1;
                const dim = s.roundsPlayed === 0 ? "text-forest-400" : "";
                return (
                  <tr key={s.player.id} className="border-t border-forest-100">
                    <td className="py-2 px-3">
                      {s.roundsPlayed > 0 ? <MedalBadge position={rank} /> : <span className="text-forest-400 text-xs">{rank}</span>}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar playerId={s.player.id} name={s.player.name} size="sm" imageUrl={s.player.udiscAvatarUrl} />
                        <Link href={`/players/${s.player.id}?season=${year}`} className={`hover:underline truncate ${dim}`}>
                          {s.player.name}
                        </Link>
                      </div>
                    </td>
                    <td className={`py-2 px-3 text-right tabular-nums font-semibold ${dim}`}>{fmtPoints(s.points)}</td>
                    <td className={`py-2 px-3 text-right tabular-nums hidden sm:table-cell ${dim}`}>{s.wins}</td>
                    <td className={`py-2 px-3 text-right tabular-nums hidden sm:table-cell ${dim}`}>{s.roundsPlayed}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="lg:col-span-2 card p-4">
          <h3 className="font-display font-bold text-forest-800 mb-3">Badge history</h3>
          {timeline.length === 0 ? (
            <p className="text-sm text-forest-600">No rounds recorded for {year}.</p>
          ) : (
            <ol className="space-y-3">
              {timeline.map((t, i) => {
                const holder = roster.find((p) => p.id === t.holderId);
                return (
                  <li key={t.round.id + i} className="flex items-start gap-3">
                    <Avatar playerId={t.holderId} name={holder?.name ?? "?"} size="sm" imageUrl={holder?.udiscAvatarUrl} />
                    <Link href={`/rounds/${t.round.id}`} className="flex-1 min-w-0 block group">
                      <div className="text-sm font-semibold text-forest-800 group-hover:underline">
                        {holder?.name ?? t.holderId}
                      </div>
                      <div className="text-xs text-forest-600">
                        {kindLabel(t.kind)}
                        {" · "}{prettyDate(t.round.date)}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
