import Link from "next/link";
import { getRoster, getRounds, getSettings } from "@/lib/store";
import { seasonRounds, winnersOfRound } from "@/lib/scoring";
import { prettyDate } from "@/lib/format";
import { BadgeCrown } from "@/components/BadgeCrown";

export default async function RoundsPage() {
  const [roster, rounds, settings] = await Promise.all([getRoster(), getRounds(), getSettings()]);
  const byName = new Map(roster.map((p) => [p.id, p.name]));
  const all = [...seasonRounds(rounds, settings.currentSeason)].reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-forest-800">Rounds — {settings.currentSeason}</h2>
        <Link
          href="/admin/rounds/new"
          className="rounded-lg bg-forest-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-forest-700"
        >
          + Add round
        </Link>
      </div>
      {all.length === 0 && <p className="text-forest-600">No rounds yet.</p>}
      <ul className="space-y-2">
        {all.map((r, idx) => {
          const winners = winnersOfRound(r).map((id) => byName.get(id) ?? id);
          const isLatest = idx === 0;
          return (
            <li key={r.id}>
              <Link
                href={`/rounds/${r.id}`}
                className="block rounded-xl border border-forest-100 bg-white p-3 shadow-sm hover:border-forest-300"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-forest-800">
                      {prettyDate(r.date)}
                      {r.courseName ? ` — ${r.courseName}` : ""}
                    </div>
                    <div className="text-sm text-forest-600">
                      {r.results.length} players · Winner: {winners.join(", ")}
                    </div>
                  </div>
                  {isLatest && <BadgeCrown size="sm" />}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
