import Link from "next/link";
import { getHistory, getPatchTransfers, getRoster, getRounds, getSettings } from "@/lib/store";
import {
  availableSeasons,
  allTimeLongestStreak,
  badgeTimeline,
  computeStandings,
  patchThefts,
  recentForm,
  roundsByMonth,
  seasonRounds,
} from "@/lib/scoring";
import { Avatar } from "@/components/Avatar";
import { BadgeCrown } from "@/components/BadgeCrown";
import { prettyDate } from "@/lib/format";

export default async function StatsPage() {
  const [roster, rounds, settings, history, transfers] = await Promise.all([
    getRoster(),
    getRounds(),
    getSettings(),
    getHistory(),
    getPatchTransfers(),
  ]);
  const seasons = availableSeasons(rounds, settings.currentSeason, history.map((h) => h.season));

  const allTimeWins = new Map<string, number>();
  const allTimeRounds = new Map<string, number>();
  const allTimePodiums = new Map<string, number>();
  for (const r of rounds) {
    for (const res of r.results) {
      allTimeRounds.set(res.playerId, (allTimeRounds.get(res.playerId) ?? 0) + 1);
      if (res.position === 1) allTimeWins.set(res.playerId, (allTimeWins.get(res.playerId) ?? 0) + 1);
      if (res.position <= 3) allTimePodiums.set(res.playerId, (allTimePodiums.get(res.playerId) ?? 0) + 1);
    }
  }
  const thefts = patchThefts(rounds, history, transfers);
  const monthly = roundsByMonth(rounds);

  // Patch stats across all seasons
  const patchDefends = new Map<string, number>();
  const patchRoundsHeld = new Map<string, number>();
  let totalPatchChanges = 0;
  for (const season of seasons) {
    const initialHolder = history.find((h) => h.season === season)?.initialBadgeHolderPlayerId ?? null;
    const tl = badgeTimeline(rounds, season, initialHolder, transfers);
    for (const e of tl) {
      if (e.kind === "defended" || e.kind === "first") {
        // holder played as holder
        patchRoundsHeld.set(e.holderId, (patchRoundsHeld.get(e.holderId) ?? 0) + 1);
      } else if (e.kind === "stolen" && e.prevHolderId) {
        // previous holder played (and lost) — they were the holder that round
        patchRoundsHeld.set(e.prevHolderId, (patchRoundsHeld.get(e.prevHolderId) ?? 0) + 1);
      }
      if (e.kind === "defended") patchDefends.set(e.holderId, (patchDefends.get(e.holderId) ?? 0) + 1);
      if (e.kind === "stolen") totalPatchChanges++;
    }
  }

  const activePlayers = roster.filter((p) => (allTimeRounds.get(p.id) ?? 0) > 0);

  const mostWins = [...activePlayers].sort((a, b) => (allTimeWins.get(b.id) ?? 0) - (allTimeWins.get(a.id) ?? 0)).slice(0, 5);
  const mostActive = [...activePlayers].sort((a, b) => (allTimeRounds.get(b.id) ?? 0) - (allTimeRounds.get(a.id) ?? 0)).slice(0, 5);
  const topThieves = [...activePlayers].sort((a, b) => (thefts.get(b.id) ?? 0) - (thefts.get(a.id) ?? 0)).filter((p) => (thefts.get(p.id) ?? 0) > 0).slice(0, 5);
  const topDefenders = [...activePlayers].sort((a, b) => (patchDefends.get(b.id) ?? 0) - (patchDefends.get(a.id) ?? 0)).filter((p) => (patchDefends.get(p.id) ?? 0) > 0).slice(0, 5);
  const mostHeld = [...activePlayers].sort((a, b) => (patchRoundsHeld.get(b.id) ?? 0) - (patchRoundsHeld.get(a.id) ?? 0)).filter((p) => (patchRoundsHeld.get(p.id) ?? 0) > 0).slice(0, 5);

  const longestStreakRows = activePlayers
    .map((p) => ({ p, streak: allTimeLongestStreak(rounds, p.id) }))
    .filter((x) => x.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5);

  const totalRounds = rounds.length;
  const totalPlayed = [...allTimeRounds.values()].reduce((a, b) => a + b, 0);
  const firstRound = rounds.length > 0 ? [...rounds].sort((a, b) => a.date.localeCompare(b.date))[0] : null;

  const maxMonth = Math.max(1, ...monthly.values());

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl font-bold text-forest-800">Stats</h2>
        <p className="text-sm text-forest-600">All-time numbers across every season.</p>
      </header>

      {/* OVERVIEW TILES */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile label="Rounds recorded" value={String(totalRounds)} />
        <Tile label="Player-rounds" value={String(totalPlayed)} />
        <Tile label="Seasons" value={String(seasons.length)} />
        <Tile label="Since" value={firstRound ? prettyDate(firstRound.date) : "—"} />
      </section>

      {/* ACTIVITY PER MONTH — only meaningful once there's a few months of history */}
      {monthly.size >= 3 && (
        <section className="card p-4">
          <h3 className="font-display font-bold text-forest-800 mb-3">Rounds per month</h3>
          <div className="flex items-end gap-1 h-28">
            {[...monthly.entries()].map(([ym, count]) => (
              <div key={ym} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-forest-500 rounded-t"
                  style={{ height: `${(count / maxMonth) * 100}%`, minHeight: 2 }}
                  title={`${ym}: ${count}`}
                />
                <span className="text-[10px] text-forest-700 rotate-45 origin-top-left whitespace-nowrap">{ym.slice(2)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LEADERBOARDS */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Leaderboard title="🏆 Most wins" rows={mostWins.map((p) => ({ p, v: allTimeWins.get(p.id) ?? 0 }))} />
        <Leaderboard title="🥏 Most rounds played" rows={mostActive.map((p) => ({ p, v: allTimeRounds.get(p.id) ?? 0 }))} />
        <Leaderboard title="🔥 Longest win streak" rows={longestStreakRows.map((r) => ({ p: r.p, v: r.streak }))} />
      </div>

      {/* PATCH STATS */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-forest-800">🧥 Patch stats</h3>
          <span className="text-xs text-forest-500">all-time · {totalPatchChanges} total change{totalPatchChanges !== 1 ? "s" : ""}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Leaderboard title="🗡 Most steals" rows={topThieves.map((p) => ({ p, v: thefts.get(p.id) ?? 0 }))} unit="steal" />
          <Leaderboard title="🛡 Most defends" rows={topDefenders.map((p) => ({ p, v: patchDefends.get(p.id) ?? 0 }))} unit="defend" />
          <Leaderboard title="📅 Most rounds held" rows={mostHeld.map((p) => ({ p, v: patchRoundsHeld.get(p.id) ?? 0 }))} unit="round" />
        </div>
      </section>

      {/* RECENT FORM */}
      <section className="card p-4">
        <h3 className="font-display font-bold text-forest-800 mb-3">Recent form · last 5</h3>
        <ul className="divide-y divide-forest-100">
          {activePlayers.map((p) => {
            const form = recentForm(rounds, p.id, 5);
            return (
              <li key={p.id} className="py-2 flex items-center gap-3">
                <Avatar playerId={p.id} name={p.name} size="sm" imageUrl={p.udiscAvatarUrl} />
                <Link href={`/players/${p.id}`} className="flex-1 text-sm text-forest-800 hover:underline truncate">{p.name}</Link>
                <div className="flex gap-1">
                  {form.length === 0 ? <span className="text-xs text-forest-500">no rounds</span> : form.map((f, i) => {
                    const style =
                      f.position === 1 ? "bg-amber-300 text-amber-900" :
                      f.position === 2 ? "bg-slate-300 text-slate-800" :
                      f.position === 3 ? "bg-orange-300 text-orange-900" :
                      "bg-forest-100 text-forest-600";
                    return (
                      <span
                        key={i}
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${style}`}
                        title={`${f.position}${f.position === 1 ? "st" : f.position === 2 ? "nd" : f.position === 3 ? "rd" : "th"} of ${f.fieldSize}`}
                      >
                        {f.position}
                      </span>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* CHAMPIONS */}
      <section className="card p-4">
        <h3 className="font-display font-bold text-forest-800 mb-3">Season champions</h3>
        <ul className="space-y-2">
          {history
            .filter((h) => h.season < settings.currentSeason && h.championName)
            .sort((a, b) => b.season - a.season)
            .map((h) => (
              <li key={h.season} className="flex items-center gap-3">
                <BadgeCrown size="sm" imageUrl={h.badgeImageUrl} />
                <span className="font-semibold text-forest-800">{h.season}</span>
                <span className="text-forest-700">{h.championName}</span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-forest-600">{label}</div>
      <div className="font-display text-2xl font-bold text-forest-800 mt-1">{value}</div>
    </div>
  );
}

function Leaderboard({
  title,
  rows,
  unit,
}: {
  title: string;
  rows: { p: { id: string; name: string; udiscAvatarUrl?: string }; v: number }[];
  unit?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.v));
  return (
    <section className="card p-4">
      <h3 className="font-display font-bold text-forest-800 mb-3">{title}</h3>
      <ul className="space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-forest-500">No data yet.</li>
        ) : (
          rows.map((r) => (
            <li key={r.p.id} className="flex items-center gap-2">
              <Avatar playerId={r.p.id} name={r.p.name} size="xs" imageUrl={r.p.udiscAvatarUrl} />
              <Link href={`/players/${r.p.id}`} className="flex-1 text-sm text-forest-800 hover:underline truncate">
                {r.p.name}
              </Link>
              <div className="flex-1 h-2 rounded-full bg-forest-100 overflow-hidden max-w-24">
                <div
                  className="h-full bg-forest-600"
                  style={{ width: `${(r.v / max) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold tabular-nums text-forest-800 w-8 text-right" title={unit ? `${r.v} ${r.v === 1 ? unit : unit + "s"}` : undefined}>{r.v}</span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
