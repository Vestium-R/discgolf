import Link from "next/link";
import { getHistory, getRoster, getRounds, getSettings } from "@/lib/store";
import {
  availableSeasons,
  badgeHoldStreak,
  badgeTimeline,
  computeStandings,
  currentBadgeHolder,
  rankDeltas,
  seasonRounds,
  currentStreak,
} from "@/lib/scoring";
import { BadgeCrown, MedalBadge } from "@/components/BadgeCrown";
import { Avatar } from "@/components/Avatar";
import { RankDelta } from "@/components/RankDelta";
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
  const seasonRec = history.find((h) => h.season === season);
  const badgeImage = seasonRec?.badgeImageUrl;
  const initialHolderId = seasonRec?.initialBadgeHolderPlayerId ?? null;
  const seasons = availableSeasons(rounds, season, history.map((h) => h.season));
  const standings = computeStandings(roster, rounds, season);
  const badgeId = currentBadgeHolder(rounds, season, initialHolderId);
  const badgeHolder = badgeId ? roster.find((p) => p.id === badgeId) : null;
  const leader = standings.find((s) => s.roundsPlayed > 0) ?? null;
  const leaderDifferentFromBadge = leader && leader.player.id !== badgeId;
  const rs = seasonRounds(rounds, season);
  const last = rs.at(-1);
  const timeline = badgeTimeline(rounds, season, initialHolderId).slice(-6).reverse();
  const priorChamp = history.find((h) => h.season === season - 1);
  const deltas = rankDeltas(roster, rounds, season);
  const held = badgeHoldStreak(rounds, season, initialHolderId);

  const playedRoster = standings.filter((s) => s.roundsPlayed > 0);

  return (
    <div className="space-y-8">
      {/* HERO — side by side: physical badge + season standings leader */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-forest-800">Season {season}</h1>
          <SeasonPicker seasons={seasons} active={season} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* CURRENT PATCH HOLDER */}
          <div className="hero-gradient rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
            <div className="text-[11px] uppercase tracking-widest opacity-80 mb-2">🧥 Patch is with</div>
            <div className="flex items-center gap-4">
              <BadgeCrown size="lg" glow imageUrl={badgeImage} />
              {badgeHolder ? (
                <div className="min-w-0">
                  <Link
                    href={`/players/${badgeHolder.id}`}
                    className="block font-display text-2xl sm:text-3xl font-bold leading-tight hover:underline truncate"
                  >
                    {badgeHolder.name}
                  </Link>
                  <div className="text-xs opacity-85 mt-1">
                    Held {held} round{held === 1 ? "" : "s"}
                  </div>
                </div>
              ) : (
                <div className="min-w-0">
                  <div className="font-display text-2xl font-bold">Up for grabs</div>
                  <div className="text-xs opacity-80">First winner claims it.</div>
                </div>
              )}
            </div>
            <p className="text-[11px] opacity-70 mt-3">
              Passes only when holder plays and someone else wins.
            </p>
          </div>

          {/* WINS LEADER — projected season champion (keeps patch forever) */}
          <div className="rounded-3xl p-5 sm:p-6 border border-forest-200 bg-white shadow-sm relative overflow-hidden">
            <div className="text-[11px] uppercase tracking-widest text-forest-600 mb-2">🏆 On pace for {season}</div>
            <div className="flex items-center gap-4">
              {leader ? (
                <>
                  <Avatar playerId={leader.player.id} name={leader.player.name} size="lg" />
                  <div className="min-w-0">
                    <Link
                      href={`/players/${leader.player.id}`}
                      className="block font-display text-2xl sm:text-3xl font-bold text-forest-800 leading-tight hover:underline truncate"
                    >
                      {leader.player.name}
                    </Link>
                    <div className="text-xs text-forest-600 mt-1 tabular-nums">
                      {leader.wins} win{leader.wins === 1 ? "" : "s"} · {leader.roundsPlayed} played · {fmtPoints(leader.points)} pts
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="font-display text-2xl font-bold text-forest-800">—</div>
                  <div className="text-xs text-forest-600">No rounds played yet.</div>
                </div>
              )}
            </div>
            <p className="text-[11px] text-forest-600 mt-3">
              Most wins at year end <strong>keeps the patch forever</strong> and adds {season} to it.
            </p>
          </div>
        </div>
        {last && (
          <p className="text-xs text-forest-600 text-center">
            Last round: {prettyDate(last.date)}
            {last.courseName ? ` at ${last.courseName}` : ""} · {last.results.length} playing
            {priorChamp ? ` · ${priorChamp.season} champ: ${priorChamp.championName}` : ""}
          </p>
        )}
      </section>

      {/* ADD ROUND */}
      <section className="card p-5">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-forest-800">Add a round</h2>
            <p className="text-sm text-forest-600">Paste a UDisc scorecard. Whoever wins takes the patch.</p>
          </div>
          <Link href="/add" className="text-xs text-forest-600 hover:underline whitespace-nowrap">
            Manual →
          </Link>
        </div>
        <PasteUdiscBox action="/api/preview" />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* STANDINGS */}
        <section className="lg:col-span-3 card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-forest-100">
            <h2 className="font-display font-bold text-forest-800">Standings</h2>
            <span className="text-xs text-forest-600">{rs.length} round{rs.length === 1 ? "" : "s"}</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-forest-50 text-forest-700">
              <tr>
                <th className="py-2 px-3 text-left w-12">#</th>
                <th className="py-2 px-3 text-left">Player</th>
                <th className="py-2 px-3 text-right">Wins</th>
                <th className="py-2 px-3 text-right hidden sm:table-cell">Pts</th>
                <th className="py-2 px-3 text-right hidden sm:table-cell">Rds</th>
                <th className="py-2 px-3 text-right w-10"></th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => {
                const isBadge = s.player.id === badgeId;
                const rank = i + 1;
                const dim = s.roundsPlayed === 0 ? "text-forest-400" : "";
                const hotStreak = currentStreak(rounds, season, s.player.id);
                return (
                  <tr
                    key={s.player.id}
                    className={`border-t border-forest-100 ${isBadge ? "bg-amber-50/40" : ""}`}
                  >
                    <td className="py-2 px-3">
                      {s.roundsPlayed > 0 ? <MedalBadge position={rank} /> : <span className="text-forest-400 text-xs">{rank}</span>}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar playerId={s.player.id} name={s.player.name} size="sm" />
                        <Link href={`/players/${s.player.id}`} className={`hover:underline truncate ${dim}`}>
                          {s.player.name}
                        </Link>
                        {isBadge && <BadgeCrown size="xs" imageUrl={badgeImage} />}
                        {hotStreak >= 2 && <span className="text-xs" title={`${hotStreak} wins in a row`}>🔥{hotStreak}</span>}
                      </div>
                    </td>
                    <td className={`py-2 px-3 text-right font-bold text-lg tabular-nums ${dim}`}>{s.wins}</td>
                    <td className={`py-2 px-3 text-right tabular-nums hidden sm:table-cell ${dim}`}>{fmtPoints(s.points)}</td>
                    <td className={`py-2 px-3 text-right tabular-nums hidden sm:table-cell ${dim}`}>{s.roundsPlayed}</td>
                    <td className="py-2 px-3 text-right"><RankDelta delta={deltas.get(s.player.id) ?? null} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-xs text-forest-500 p-3 border-t border-forest-100">
            Wins decide the season. Points (N − pos + 1) are a tiebreak. Arrows show last-round rank change.
          </p>
        </section>

        {/* PATCH TIMELINE */}
        <section className="lg:col-span-2 card p-4">
          <h2 className="font-display font-bold text-forest-800 mb-3">Patch passes</h2>
          {timeline.length === 0 ? (
            <p className="text-sm text-forest-600">No rounds yet this season.</p>
          ) : (
            <ol className="space-y-3">
              {timeline.map((t, i) => {
                const holder = roster.find((p) => p.id === t.holderId);
                return (
                  <li key={t.round.id + i} className="flex items-start gap-3">
                    <Avatar playerId={t.holderId} name={holder?.name ?? "?"} size="sm" />
                    <div className="flex-1 min-w-0">
                      <Link href={`/rounds/${t.round.id}`} className="block">
                        <div className="text-sm font-semibold text-forest-800 hover:underline">
                          {holder?.name ?? t.holderId}
                        </div>
                        <div className="text-xs text-forest-600">
                          {t.kind === "stolen" ? <>🗡 Stole the patch</> :
                           t.kind === "defended" ? <>🛡 Defended</> :
                           t.kind === "no-change" ? <>💤 Patch stayed (holder sat out)</> :
                           <>🥏 First of the season</>}
                          {" · "}{prettyDate(t.round.date)}
                        </div>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {timeline.length > 0 && (
            <Link href="/rounds" className="mt-3 inline-block text-xs text-forest-600 hover:underline">
              All rounds →
            </Link>
          )}
        </section>
      </div>

      {/* WHO'S PLAYED */}
      {playedRoster.length > 0 && (
        <section className="card p-4">
          <h2 className="font-display font-bold text-forest-800 mb-3">Who&apos;s played</h2>
          <div className="flex flex-wrap gap-2">
            {playedRoster.map((s) => (
              <Link
                key={s.player.id}
                href={`/players/${s.player.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-forest-50 px-3 py-1.5 hover:bg-forest-100 transition"
              >
                <Avatar playerId={s.player.id} name={s.player.name} size="xs" />
                <span className="text-sm text-forest-800">{s.player.name}</span>
                <span className="text-xs text-forest-600">· {s.roundsPlayed}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
