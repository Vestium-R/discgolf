import Link from "next/link";
import { getRoster, getRounds, getSettings } from "@/lib/store";
import { availableSeasons, seasonRounds, winnersOfRound } from "@/lib/scoring";
import { prettyDate } from "@/lib/format";
import { BadgeCrown } from "@/components/BadgeCrown";
import { SeasonPicker } from "@/components/SeasonPicker";
import { VARIANT_EMOJI, VARIANT_LABELS } from "@/lib/types";
import { rateConditions } from "@/lib/conditions";

export default async function RoundsPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const [roster, rounds, settings] = await Promise.all([getRoster(), getRounds(), getSettings()]);
  const { season: seasonParam } = await searchParams;
  const season = Number(seasonParam) || settings.currentSeason;
  const byName = new Map(roster.map((p) => [p.id, p.name]));
  const seasons = availableSeasons(rounds, settings.currentSeason, []);
  const all = [...seasonRounds(rounds, season)].reverse();

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-forest-800">Rounds</h2>
          <p className="text-sm text-forest-600">Season {season} · {all.length} round{all.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeasonPicker seasons={seasons} active={season} base="/rounds?season=" />
          <Link href="/add" className="btn-primary">+ Add round</Link>
        </div>
      </header>
      {all.length === 0 && (
        <div className="card p-6 text-center">
          <p className="text-forest-600">No rounds yet.</p>
          <Link href="/add" className="btn-primary mt-3 inline-flex">Paste the first scorecard</Link>
        </div>
      )}
      <ul className="space-y-2">
        {all.map((r, idx) => {
          const winners = winnersOfRound(r).map((id) => byName.get(id) ?? id);
          const isLatest = idx === 0 && season === settings.currentSeason;
          const cond = rateConditions(r.temperatureC, r.windKph);
          return (
            <li key={r.id}>
              <Link
                href={`/rounds/${r.id}`}
                className="block card p-3 hover:border-forest-300 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-forest-800 truncate">
                        {prettyDate(r.date)}
                        {r.courseName ? ` — ${r.courseName}` : ""}
                      </span>
                      {r.variant !== "standard" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-800 px-2 py-0.5 text-[10px] font-semibold">
                          {VARIANT_EMOJI[r.variant]} {VARIANT_LABELS[r.variant]}
                        </span>
                      )}
                      {cond && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cond.className}`}>
                          {cond.emoji} {cond.label}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-forest-600">
                      {r.results.length} players · Winner: {winners.join(", ")}
                      {r.counts === false && <span className="ml-1 text-purple-700">· history only</span>}
                    </div>
                  </div>
                  {isLatest && r.counts !== false && <BadgeCrown size="sm" />}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
