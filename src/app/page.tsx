import Link from "next/link";
import { getHistory, getRoster, getRounds, getSettings } from "@/lib/store";
import {
  availableSeasons,
  badgeHoldStreak,
  badgeTimeline,
  computeStandings,
  currentBadgeHolder,
  headToHead,
  rankDeltas,
  seasonRounds,
  currentStreak,
} from "@/lib/scoring";
import { BadgeCrown, MedalBadge } from "@/components/BadgeCrown";
import { Avatar } from "@/components/Avatar";
import { RankDelta } from "@/components/RankDelta";
import { PasteUdiscBox } from "@/components/PasteUdiscBox";
import { SeasonPicker } from "@/components/SeasonPicker";
import { ShareStandings } from "@/components/ShareStandings";
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
  const standings = computeStandings(roster, rounds, season).filter(
    (s) => s.player.active || s.roundsPlayed > 0,
  );
  const badgeId = currentBadgeHolder(rounds, season, initialHolderId);
  const badgeHolder = badgeId ? roster.find((p) => p.id === badgeId) : null;
  const leader = standings.find((s) => s.roundsPlayed > 0) ?? null;
  const leaderDifferentFromBadge = leader && leader.player.id !== badgeId;
  const rs = seasonRounds(rounds, season);
  const last = rs.at(-1);
  const timeline = badgeTimeline(rounds, season, initialHolderId).slice(-6).reverse();
  const deltas = rankDeltas(roster, rounds, season);
  const held = badgeHoldStreak(rounds, season, initialHolderId);
  const pastChampions = history
    .filter((h) => h.season < season && h.championName)
    .sort((a, b) => b.season - a.season);

  // Build rotating insight candidates — one is picked at random on each page load.
  type Insight = { emoji: string; text: string };
  const insights: Insight[] = [];

  // Points gaps between adjacent standings
  const contenders = standings.filter((s) => s.roundsPlayed >= 2);
  for (let i = 0; i < contenders.length - 1; i++) {
    const gap = contenders[i].points - contenders[i + 1].points;
    if (gap >= 0) {
      const pts = fmtPoints(gap);
      insights.push({ emoji: "⚔️", text: `${contenders[i].player.name} leads ${contenders[i + 1].player.name} by ${pts} pt${gap === 1 ? "" : "s"}.` });
    }
  }

  // Hot win streaks
  for (const s of standings) {
    const streak = currentStreak(rounds, season, s.player.id);
    if (streak >= 2) insights.push({ emoji: "🔥", text: `${s.player.name} has won ${streak} rounds in a row.` });
  }

  // Patch hold streak
  if (held >= 2 && badgeHolder) {
    insights.push({ emoji: "🧥", text: `${badgeHolder.name} has held the patch for ${held} rounds without losing it.` });
  }

  // H2H dominance (top 4 players only, avoid too many combos)
  for (const s of standings.slice(0, 4)) {
    const h2h = headToHead(rounds, s.player.id);
    for (const [pid, stats] of h2h) {
      if (stats.rounds >= 3 && stats.wins / stats.rounds >= 0.7) {
        const opp = roster.find((p) => p.id === pid);
        if (opp) insights.push({ emoji: "📊", text: `${s.player.name} has beaten ${opp.name} in ${stats.wins} of their ${stats.rounds} rounds together.` });
      }
    }
  }

  // Winless player with most rounds played (adds drama)
  const winless = standings.filter((s) => s.roundsPlayed >= 3 && s.wins === 0);
  if (winless.length > 0) {
    const p = winless[0];
    insights.push({ emoji: "👀", text: `${p.player.name} has played ${p.roundsPlayed} rounds this season without a win. The drought continues.` });
  }

  const insight: Insight | null = insights.length > 0
    ? insights[Math.floor(Math.random() * insights.length)]
    : null;

  const playedRoster = standings.filter((s) => s.roundsPlayed > 0);

  // Standings share text
  const medals = ["🥇", "🥈", "🥉"];
  const standingsText = [
    `🥏 The Patch — Season ${season} Standings`,
    ...standings
      .filter((s) => s.roundsPlayed > 0)
      .map((s, i) => {
        const medal = medals[i] ?? `${i + 1}.`;
        return `${medal} ${s.player.name} — ${s.wins}W · ${fmtPoints(s.points)} pts`;
      }),
    ...(badgeHolder ? [`\n🧥 Patch: ${badgeHolder.name}`] : []),
  ].join("\n");

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
                    {held === 0 ? "Hasn't defended yet" : `Held ${held} round${held === 1 ? "" : "s"}`}
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
                  <Avatar playerId={leader.player.id} name={leader.player.name} size="lg" imageUrl={leader.player.udiscAvatarUrl} />
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
        {insight && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
            <span className="text-2xl shrink-0">{insight.emoji}</span>
            <p className="text-sm text-amber-900">{insight.text}</p>
          </div>
        )}
        {last && (
          <p className="text-xs text-forest-600 text-center">
            Last round:{" "}
            <Link href={`/rounds/${last.id}`} className="text-forest-700 hover:text-forest-900 hover:underline font-medium">
              {prettyDate(last.date)}{last.courseName ? ` at ${last.courseName}` : ""}
            </Link>
            {" · "}{last.results.length} playing
          </p>
        )}
      </section>

      {/* ADD ROUND */}
      <section className="card p-5">
        <div className="mb-3">
          <h2 className="font-display text-lg font-bold text-forest-800">Add a round</h2>
          <p className="text-sm text-forest-600">Paste a UDisc scorecard link to save the round.</p>
        </div>
        <PasteUdiscBox action="/api/preview" />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* STANDINGS */}
        <section className="lg:col-span-3 card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-forest-100">
            <h2 className="font-display font-bold text-forest-800">Standings</h2>
            <div className="flex items-center gap-3">
              {playedRoster.length > 0 && (
                <ShareStandings text={standingsText} url="https://discgolf-eight.vercel.app" />
              )}
              <span className="text-xs text-forest-600">{rs.length} round{rs.length === 1 ? "" : "s"}</span>
            </div>
          </div>

          {/* Mobile: card list */}
          <ul className="sm:hidden divide-y divide-forest-100">
            {standings.map((s, i) => {
              const isBadge = s.player.id === badgeId;
              const rank = i + 1;
              const dim = s.roundsPlayed === 0 ? "opacity-40" : "";
              const hotStreak = currentStreak(rounds, season, s.player.id);
              return (
                <li key={s.player.id} className={isBadge ? "bg-amber-50/40" : ""}>
                  <Link href={`/players/${s.player.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-forest-50">
                    <span className={`w-6 text-center shrink-0 ${dim}`}>
                      {s.roundsPlayed > 0 ? <MedalBadge position={rank} /> : <span className="text-xs text-forest-400">{rank}</span>}
                    </span>
                    <Avatar playerId={s.player.id} name={s.player.name} size="sm" imageUrl={s.player.udiscAvatarUrl} />
                    <div className={`flex-1 min-w-0 ${dim}`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-forest-800 truncate">{s.player.name}</span>
                        {isBadge && <BadgeCrown size="xs" imageUrl={badgeImage} />}
                        {hotStreak >= 2 && <span className="text-xs">🔥</span>}
                      </div>
                      <div className="text-xs text-forest-500 tabular-nums">
                        {s.wins}W · {fmtPoints(s.points)} pts · {s.roundsPlayed} rounds
                      </div>
                    </div>
                    <RankDelta delta={deltas.get(s.player.id) ?? null} />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop: table */}
          <table className="hidden sm:table w-full text-sm">
            <thead className="bg-forest-50 text-forest-700">
              <tr>
                <th className="py-2 px-3 text-left w-12">#</th>
                <th className="py-2 px-3 text-left">Player</th>
                <th className="py-2 px-3 text-right">Wins</th>
                <th className="py-2 px-3 text-right">Pts</th>
                <th className="py-2 px-3 text-right">Rds</th>
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
                  <tr key={s.player.id} className={`border-t border-forest-100 ${isBadge ? "bg-amber-50/40" : ""}`}>
                    <td className="py-2 px-3">
                      {s.roundsPlayed > 0 ? <MedalBadge position={rank} /> : <span className="text-forest-400 text-xs">{rank}</span>}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar playerId={s.player.id} name={s.player.name} size="sm" imageUrl={s.player.udiscAvatarUrl} />
                        <Link href={`/players/${s.player.id}`} className={`hover:underline truncate flex-1 min-w-0 ${dim}`}>
                          {s.player.name}
                        </Link>
                        {isBadge && <BadgeCrown size="xs" imageUrl={badgeImage} />}
                        {hotStreak >= 2 && <span className="text-xs" title={`${hotStreak} wins in a row`}>🔥{hotStreak}</span>}
                      </div>
                    </td>
                    <td className={`py-2 px-3 text-right font-bold text-lg tabular-nums ${dim}`}>{s.wins}</td>
                    <td className={`py-2 px-3 text-right tabular-nums ${dim}`}>{fmtPoints(s.points)}</td>
                    <td className={`py-2 px-3 text-right tabular-nums ${dim}`}>{s.roundsPlayed}</td>
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
            <ol className="space-y-2">
              {timeline.map((t, i) => {
                const holder = roster.find((p) => p.id === t.holderId);
                return (
                  <li key={t.round.id + i}>
                    <Link
                      href={`/rounds/${t.round.id}`}
                      className="flex items-center gap-3 rounded-xl border border-forest-100 bg-white px-3 py-2 hover:border-forest-300 hover:bg-forest-50 transition group"
                    >
                      <Avatar playerId={t.holderId} name={holder?.name ?? "?"} size="sm" imageUrl={holder?.udiscAvatarUrl} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-forest-800 group-hover:underline truncate">
                          {holder?.name ?? t.holderId}
                        </div>
                        <div className="text-xs text-forest-600">
                          {t.kind === "stolen" ? <>🗡 Stole the patch</> :
                           t.kind === "defended" ? <>🛡 Defended</> :
                           t.kind === "no-change" ? <>💤 Patch stayed (holder sat out)</> :
                           <>🥏 First of the season</>}
                          {" · "}{prettyDate(t.round.date)}
                        </div>
                      </div>
                      <span className="text-forest-400 group-hover:text-forest-700 transition">→</span>
                    </Link>
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

      {/* PAST SEASON CHAMPIONS */}
      {pastChampions.length > 0 && (
        <section className="card p-4">
          <h2 className="font-display font-bold text-forest-800 mb-3">Past season winners</h2>
          <ul className="space-y-2">
            {pastChampions.map((h) => {
              const champ = h.championPlayerId ? roster.find((p) => p.id === h.championPlayerId) : null;
              return (
                <li key={h.season}>
                  <Link
                    href={`/seasons/${h.season}`}
                    className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 hover:border-amber-300 hover:bg-amber-100 transition group"
                  >
                    <span className="text-2xl">👑</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-amber-900 group-hover:underline">
                        Season champion
                      </div>
                      <div className="text-sm text-amber-800">
                        {h.season} · {champ?.name ?? h.championName}
                      </div>
                    </div>
                    {champ && <Avatar playerId={champ.id} name={champ.name} size="sm" imageUrl={champ.udiscAvatarUrl} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* WHO'S PLAYED */}
      {playedRoster.length > 0 && (
        <section className="card p-4">
          <h2 className="font-display font-bold text-forest-800 mb-3">Who&apos;s played this season</h2>
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
