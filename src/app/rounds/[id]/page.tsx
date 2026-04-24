import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoster, getRounds } from "@/lib/store";
import { pointsForRound } from "@/lib/scoring";
import { fmtPoints, prettyDate, ordinal } from "@/lib/format";
import { isAdmin } from "@/lib/auth";
import { deleteRoundAction } from "@/app/actions";
import { ShareSummary } from "@/components/ShareSummary";
import { BadgeCrown, MedalBadge } from "@/components/BadgeCrown";

export default async function RoundDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string; dup?: string }>;
}) {
  const { id } = await params;
  const { new: isNew, dup } = await searchParams;
  const [roster, rounds, admin] = await Promise.all([getRoster(), getRounds(), isAdmin()]);
  const round = rounds.find((r) => r.id === id);
  if (!round) notFound();

  const byId = new Map(roster.map((p) => [p.id, p]));
  const pts = pointsForRound(round);
  const ordered = [...round.results].sort((a, b) => a.position - b.position);
  const winnerName = byId.get(ordered[0]?.playerId ?? "")?.name ?? "Unknown";

  const summary = buildSummary({
    date: round.date,
    courseName: round.courseName,
    season: round.season,
    results: ordered.map((r) => ({
      pos: r.position,
      name: byId.get(r.playerId)?.name ?? "?",
      points: pts.get(r.playerId) ?? 0,
    })),
  });

  return (
    <div className="space-y-5">
      <Link href="/rounds" className="text-sm text-forest-600 hover:underline">← All rounds</Link>

      {isNew && (
        <div className="card bg-forest-50 border-forest-200 p-3 text-sm text-forest-800">
          🥏 Round saved. The badge now rides with <strong>{winnerName}</strong>.
        </div>
      )}
      {dup && (
        <div className="card bg-amber-50 border-amber-200 p-3 text-sm text-amber-900">
          Someone already posted this scorecard — no double-counting. Here it is.
        </div>
      )}

      <header className="card p-5">
        <div className="flex items-start gap-4">
          <BadgeCrown size="lg" />
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold text-forest-800">
              {prettyDate(round.date)}
              {round.courseName ? ` — ${round.courseName}` : ""}
            </h2>
            <p className="text-sm text-forest-600">
              Season {round.season} ·{" "}
              {round.source === "udisc" && round.udiscUrl ? (
                <a href={round.udiscUrl} target="_blank" rel="noreferrer" className="underline">
                  UDisc scorecard
                </a>
              ) : (
                "Manual entry"
              )}{" "}
              · Winner: <strong>{winnerName}</strong>
            </p>
            {round.note && <p className="text-sm text-forest-700 mt-1 italic">{round.note}</p>}
          </div>
        </div>
      </header>

      <section className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-forest-50 text-forest-700">
            <tr>
              <th className="py-2 px-3 text-left w-12">Pos</th>
              <th className="py-2 px-3 text-left">Player</th>
              <th className="py-2 px-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((r) => {
              const p = byId.get(r.playerId);
              return (
                <tr key={r.playerId} className="border-t border-forest-100">
                  <td className="py-2 px-3"><MedalBadge position={r.position} /></td>
                  <td className="py-2 px-3">
                    {p ? (
                      <Link href={`/players/${p.id}`} className="hover:underline">{p.name}</Link>
                    ) : (
                      r.playerId
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold tabular-nums">{fmtPoints(pts.get(r.playerId) ?? 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <ShareSummary text={summary} />

      {admin && (
        <form action={deleteRoundAction}>
          <input type="hidden" name="id" value={round.id} />
          <button className="text-sm text-red-700 hover:underline" type="submit">
            Delete this round
          </button>
        </form>
      )}
    </div>
  );
}

function buildSummary(r: {
  date: string;
  courseName?: string;
  season: number;
  results: { pos: number; name: string; points: number }[];
}): string {
  const medals = ["🥇", "🥈", "🥉"];
  const lines: string[] = [];
  lines.push(`🥏 ${r.date}${r.courseName ? ` @ ${r.courseName}` : ""}`);
  for (const row of r.results) {
    const medal = medals[row.pos - 1] ?? `${row.pos}.`;
    lines.push(`${medal} ${row.name} (+${fmtPoints(row.points)} pts)`);
  }
  lines.push("");
  lines.push("Badge moves → full standings on the site.");
  return lines.join("\n");
}
