import Link from "next/link";
import { getRoster, getRounds, getSettings, getHistory, getPatchTransfers } from "@/lib/store";
import { availableSeasons, badgeTimeline, seasonRounds, winnersOfRound } from "@/lib/scoring";
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
  const [roster, rounds, settings, history, transfers] = await Promise.all([getRoster(), getRounds(), getSettings(), getHistory(), getPatchTransfers()]);
  const { season: seasonParam } = await searchParams;
  const season = Number(seasonParam) || settings.currentSeason;
  const byName = new Map(roster.map((p) => [p.id, p.name]));
  const seasons = availableSeasons(rounds, settings.currentSeason, []);
  const all = [...seasonRounds(rounds, season)].reverse();
  const initialHolderId = history.find((h) => h.season === season)?.initialBadgeHolderPlayerId ?? null;
  const patchByRound = new Map(badgeTimeline(rounds, season, initialHolderId, transfers).map((e) => [e.round.id, e]));

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
          const patch = patchByRound.get(r.id);
          const patchLabel = patch
            ? patch.kind === "stolen" ? { icon: "🗡", label: byName.get(patch.holderId) ?? patch.holderId }
            : patch.kind === "defended" ? { icon: "🛡", label: byName.get(patch.holderId) ?? patch.holderId }
            : patch.kind === "transfer" ? { icon: "↔", label: byName.get(patch.holderId) ?? patch.holderId }
            : patch.kind === "first" ? { icon: "🥏", label: byName.get(patch.holderId) ?? patch.holderId }
            : { icon: "💤", label: byName.get(patch.holderId) ?? patch.holderId }
            : null;
          const playerInitials = [...r.results]
            .sort((a, b) => a.position - b.position)
            .map((x) => {
              const name = byName.get(x.playerId) ?? "?";
              const parts = name.split(/\s+/).filter(Boolean);
              return parts.length >= 2
                ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
                : parts[0]?.slice(0, 2).toUpperCase() ?? "?";
            });
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
                      {r.results.length} players (<span className="font-mono tracking-wide">{playerInitials.join(", ")}</span>) · Winner: {winners.join(", ")}
                      {r.counts === false && <span className="ml-1 text-purple-700">· history only</span>}
                    </div>
                  </div>
                  {patchLabel && r.counts !== false && (
                    <div className="shrink-0 flex items-center gap-1 text-xs text-forest-600 whitespace-nowrap">
                      <span>{patchLabel.icon}</span>
                      <span className="hidden sm:inline">{patchLabel.label}</span>
                    </div>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
