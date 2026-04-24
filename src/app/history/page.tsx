import Link from "next/link";
import { getHistory, getRoster, getRounds, getSettings } from "@/lib/store";
import { computeStandings, seasonChampion } from "@/lib/scoring";
import { BadgeCrown } from "@/components/BadgeCrown";

export default async function HistoryPage() {
  const [history, roster, rounds, settings] = await Promise.all([
    getHistory(),
    getRoster(),
    getRounds(),
    getSettings(),
  ]);

  const seasons = new Set<number>();
  for (const r of rounds) seasons.add(r.season);
  for (const h of history) seasons.add(h.season);
  const ordered = [...seasons].sort((a, b) => b - a);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-forest-800">Season history</h2>
      {ordered.length === 0 && <p className="text-forest-600">No seasons recorded yet.</p>}
      <div className="space-y-3">
        {ordered.map((yr) => {
          const rec = history.find((h) => h.season === yr);
          const standings = computeStandings(roster, rounds, yr);
          const champ = yr < settings.currentSeason ? seasonChampion(standings) : null;
          return (
            <section key={yr} className="rounded-2xl border border-forest-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-forest-800">{yr}</h3>
                {yr === settings.currentSeason && (
                  <span className="text-xs uppercase tracking-wide text-forest-600">Current</span>
                )}
              </div>
              {rec ? (
                <div className="mt-2 flex items-center gap-2">
                  <BadgeCrown size="sm" />
                  <span className="font-medium text-forest-800">{rec.championName}</span>
                  {rec.note && <span className="text-sm text-forest-600">— {rec.note}</span>}
                </div>
              ) : champ ? (
                <div className="mt-2 flex items-center gap-2">
                  <BadgeCrown size="sm" />
                  <Link href={`/players/${champ.player.id}`} className="font-medium text-forest-800 hover:underline">
                    {champ.player.name}
                  </Link>
                  <span className="text-sm text-forest-600">
                    — {champ.wins} win{champ.wins === 1 ? "" : "s"}
                  </span>
                </div>
              ) : yr === settings.currentSeason ? (
                <p className="mt-2 text-sm text-forest-600">Season in progress.</p>
              ) : (
                <p className="mt-2 text-sm text-forest-600">No champion recorded.</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
