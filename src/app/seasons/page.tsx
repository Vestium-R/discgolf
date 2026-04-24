import Link from "next/link";
import { getHistory, getRoster, getRounds, getSettings } from "@/lib/store";
import {
  availableSeasons,
  computeStandings,
  seasonChampion,
  seasonRounds,
} from "@/lib/scoring";
import { BadgeCrown } from "@/components/BadgeCrown";

export default async function SeasonsIndex() {
  const [history, roster, rounds, settings] = await Promise.all([
    getHistory(),
    getRoster(),
    getRounds(),
    getSettings(),
  ]);
  const seasons = availableSeasons(rounds, settings.currentSeason, history.map((h) => h.season));

  return (
    <div className="space-y-5">
      <header>
        <h2 className="font-display text-2xl font-bold text-forest-800">All seasons</h2>
        <p className="text-sm text-forest-600">Every year&apos;s champion and round count.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {seasons.map((yr) => {
          const rec = history.find((h) => h.season === yr);
          const rs = seasonRounds(rounds, yr);
          const standings = computeStandings(roster, rounds, yr);
          const isCurrent = yr === settings.currentSeason;
          // For past seasons: champion from history row, else compute from standings.
          // For current season: always use the live leader regardless of what history says.
          const leaderName = isCurrent
            ? seasonChampion(standings)?.player.name ?? null
            : rec?.championName ?? seasonChampion(standings)?.player.name ?? null;
          const badgeImage = rec?.badgeImageUrl;
          return (
            <Link
              key={yr}
              href={`/seasons/${yr}`}
              className="card p-5 hover:border-forest-300 transition block"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-display text-3xl font-bold text-forest-800">{yr}</div>
                  <div className="text-xs text-forest-600 mt-1">
                    {rs.length} round{rs.length === 1 ? "" : "s"}
                    {isCurrent ? " · in progress" : ""}
                  </div>
                </div>
                {(badgeImage || leaderName) && <BadgeCrown size="lg" glow={isCurrent} imageUrl={badgeImage} />}
              </div>
              {leaderName ? (
                <div className="mt-3">
                  <div className="text-xs uppercase tracking-wide text-forest-600">
                    {isCurrent ? "Leading" : "Champion"}
                  </div>
                  <div className="font-semibold text-forest-800">{leaderName}</div>
                  {rec?.note && <div className="text-xs text-forest-500 italic mt-0.5">{rec.note}</div>}
                </div>
              ) : rs.length === 0 ? (
                <p className="mt-3 text-sm text-forest-500">No rounds recorded.</p>
              ) : (
                <p className="mt-3 text-sm text-forest-500">Standings forming…</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
