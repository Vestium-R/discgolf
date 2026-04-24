import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoster, getRounds } from "@/lib/store";
import { pointsForRound } from "@/lib/scoring";
import { fmtPoints, prettyDate, ordinal } from "@/lib/format";
import { isAdmin } from "@/lib/auth";
import { deleteRoundAction } from "@/app/actions";
import { ShareSummary } from "@/components/ShareSummary";

export default async function RoundDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
      <div>
        <Link href="/rounds" className="text-sm text-forest-600 hover:underline">← All rounds</Link>
      </div>
      <header>
        <h2 className="text-xl font-bold text-forest-800">
          {prettyDate(round.date)}
          {round.courseName ? ` — ${round.courseName}` : ""}
        </h2>
        <p className="text-sm text-forest-600">
          Season {round.season} ·{" "}
          {round.source === "udisc" && round.udiscUrl ? (
            <a href={round.udiscUrl} target="_blank" rel="noreferrer" className="underline">
              UDisc round
            </a>
          ) : (
            "Manual entry"
          )}{" "}
          · Winner: <strong>{winnerName}</strong>
        </p>
        {round.note && <p className="text-sm text-forest-700 mt-1 italic">{round.note}</p>}
      </header>

      <section className="overflow-hidden rounded-2xl border border-forest-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-forest-50 text-forest-700">
            <tr>
              <th className="py-2 px-3 text-left">Pos</th>
              <th className="py-2 px-3 text-left">Player</th>
              <th className="py-2 px-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((r) => {
              const p = byId.get(r.playerId);
              return (
                <tr key={r.playerId} className="border-t border-forest-100">
                  <td className="py-2 px-3">{ordinal(r.position)}</td>
                  <td className="py-2 px-3">
                    {p ? (
                      <Link href={`/players/${p.id}`} className="hover:underline">{p.name}</Link>
                    ) : (
                      r.playerId
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold">{fmtPoints(pts.get(r.playerId) ?? 0)}</td>
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
          <button
            className="text-sm text-red-700 hover:underline"
            type="submit"
          >
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
  lines.push(`🥏 Disc golf — ${r.date}${r.courseName ? ` @ ${r.courseName}` : ""}`);
  for (const row of r.results) {
    const medal = medals[row.pos - 1] ?? `${row.pos}.`;
    lines.push(`${medal} ${row.name} (+${fmtPoints(row.points)})`);
  }
  lines.push("");
  lines.push("Full standings: see site");
  return lines.join("\n");
}
