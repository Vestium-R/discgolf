import Link from "next/link";
import { notFound } from "next/navigation";
import { getHistory, getRoster, getRounds } from "@/lib/store";
import { badgeTimeline, pointsForRound } from "@/lib/scoring";
import { fmtPoints, prettyDate } from "@/lib/format";
import { isAdmin } from "@/lib/auth";
import { deleteRoundAction, refetchRoundAction, updateRoundCountsAction, updateRoundVariantAction } from "@/app/actions";
import { ShareSummary } from "@/components/ShareSummary";
import { BadgeCrown, MedalBadge } from "@/components/BadgeCrown";
import { Avatar } from "@/components/Avatar";
import { Confetti } from "@/components/Confetti";
import { VARIANT_EMOJI, VARIANT_LABELS, type RoundVariant } from "@/lib/types";
import { formatConditions, rateConditions } from "@/lib/conditions";

export default async function RoundDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string; dup?: string; refetched?: string }>;
}) {
  const { id } = await params;
  const { new: isNew, dup, refetched } = await searchParams;
  const [roster, rounds, history, admin] = await Promise.all([
    getRoster(),
    getRounds(),
    getHistory(),
    isAdmin(),
  ]);
  const round = rounds.find((r) => r.id === id);
  if (!round) notFound();
  const seasonRec = history.find((h) => h.season === round.season);
  const badgeImage = seasonRec?.badgeImageUrl;
  const initialHolder = seasonRec?.initialBadgeHolderPlayerId ?? null;

  const byId = new Map(roster.map((p) => [p.id, p]));
  const pts = pointsForRound(round);
  const ordered = [...round.results].sort((a, b) => a.position - b.position);
  const winner = byId.get(ordered[0]?.playerId ?? "");
  const winnerName = winner?.name ?? "Unknown";

  // Figure out what actually happened to the patch in THIS round
  const events = badgeTimeline(rounds, round.season, initialHolder);
  const thisEvent = events.find((e) => e.round.id === round.id);
  const prevHolder = thisEvent?.prevHolderId ? byId.get(thisEvent.prevHolderId) : null;
  const holderAfter = thisEvent ? byId.get(thisEvent.holderId) : null;
  const patchMsg = thisEvent
    ? thisEvent.kind === "stolen"
      ? `🗡 ${holderAfter?.name ?? "?"} stole the patch from ${prevHolder?.name ?? "?"}`
      : thisEvent.kind === "defended"
        ? `🛡 ${holderAfter?.name ?? "?"} defended the patch`
        : thisEvent.kind === "no-change"
          ? `💤 ${prevHolder?.name ?? "?"} kept the patch — didn't play, ${winnerName} won the round`
          : `🥏 ${holderAfter?.name ?? "?"} takes the patch (no prior holder set)`
    : `${winnerName} won the round`;

  const summary = buildSummary({
    date: round.date,
    courseName: round.courseName,
    season: round.season,
    patchMsg,
    results: ordered.map((r) => ({
      pos: r.position,
      name: byId.get(r.playerId)?.name ?? "?",
      points: pts.get(r.playerId) ?? 0,
      score: r.score,
      relativeScore: r.relativeScore,
    })),
  });

  return (
    <div className="space-y-5">
      {isNew && <Confetti />}

      <Link href="/rounds" className="text-sm text-forest-600 hover:underline">← All rounds</Link>

      {isNew && (
        <div className="card bg-forest-50 border-forest-200 p-3 text-sm text-forest-800">
          {patchMsg}.
        </div>
      )}
      {dup && (
        <div className="card bg-amber-50 border-amber-200 p-3 text-sm text-amber-900">
          Someone already posted this scorecard — no double-counting.
        </div>
      )}
      {refetched && (
        <div className="card bg-forest-50 border-forest-200 p-3 text-sm text-forest-800">
          Re-fetched from UDisc — scores &amp; weather updated.
        </div>
      )}

      <header className="card p-5">
        <div className="flex items-start gap-4">
          <BadgeCrown size="lg" imageUrl={badgeImage} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-xl font-bold text-forest-800">
                {prettyDate(round.date)}
                {round.courseName ? ` — ${round.courseName}` : ""}
              </h2>
              {round.variant !== "standard" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-800 px-2 py-0.5 text-xs font-semibold">
                  {VARIANT_EMOJI[round.variant]} {VARIANT_LABELS[round.variant]}
                </span>
              )}
            </div>
            <p className="text-sm text-forest-600">
              Season {round.season} · Winner: <strong>{winnerName}</strong>
              {round.counts === false && (
                <span className="ml-1 text-purple-700">· does not count for standings</span>
              )}
            </p>
            {(() => {
              const rating = rateConditions(round.temperatureC, round.windKph);
              if (!rating) return null;
              return (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${rating.className}`}>
                    {rating.emoji} {rating.label}
                  </span>
                  <span className="text-xs text-forest-600">
                    {formatConditions(round.temperatureC, round.windKph)}
                  </span>
                </div>
              );
            })()}
            {round.note && <p className="text-sm text-forest-700 mt-1 italic">&ldquo;{round.note}&rdquo;</p>}
          </div>
        </div>
        {round.source === "udisc" && round.udiscUrl && (
          <a
            href={round.udiscUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-forest-200 bg-forest-50 px-3 py-2 text-sm text-forest-800 hover:bg-forest-100 transition"
          >
            <span>📋</span>
            <span className="font-semibold">View UDisc scorecard</span>
            <span className="text-forest-500">↗</span>
          </a>
        )}
      </header>

      <section className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-forest-50 text-forest-700">
            <tr>
              <th className="py-2 px-3 text-left w-14">Pos</th>
              <th className="py-2 px-3 text-left">Player</th>
              <th className="py-2 px-3 text-right">Score</th>
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
                    <div className="flex items-center gap-2">
                      {p && <Avatar playerId={p.id} name={p.name} size="sm" imageUrl={p.udiscAvatarUrl} />}
                      {p ? (
                        <Link href={`/players/${p.id}`} className="hover:underline">{p.name}</Link>
                      ) : (
                        r.playerId
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-forest-700">
                    {r.relativeScore != null
                      ? `${r.relativeScore > 0 ? "+" : ""}${r.relativeScore}${r.score != null ? ` (${r.score})` : ""}`
                      : r.score ?? "—"}
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
        <section className="card p-4 space-y-3 border-dashed">
          <h3 className="font-display font-bold text-forest-800">Admin</h3>
          <form action={updateRoundVariantAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={round.id} />
            <label className="text-sm text-forest-700">Game format:</label>
            <select
              name="variant"
              defaultValue={round.variant}
              className="input-pill max-w-[240px]"
            >
              {(Object.keys(VARIANT_LABELS) as RoundVariant[]).map((v) => (
                <option key={v} value={v}>{VARIANT_EMOJI[v]} {VARIANT_LABELS[v]}</option>
              ))}
            </select>
            <button className="btn-secondary">Save</button>
          </form>
          <p className="text-xs text-forest-600">
            Variant is a label only — all rounds count by default. Use the checkbox below to exclude a round
            from standings/patch if you ever need to.
          </p>
          <form action={updateRoundCountsAction} className="flex flex-wrap items-center gap-2 pt-2 border-t border-forest-100">
            <input type="hidden" name="id" value={round.id} />
            <label className="text-sm text-forest-700 inline-flex items-center gap-2">
              <input type="checkbox" name="counts" value="1" defaultChecked={round.counts !== false} />
              Counts for standings + patch
            </label>
            <button className="btn-secondary">Save</button>
          </form>
          {round.udiscUrl && (
            <form action={refetchRoundAction} className="pt-2 border-t border-forest-100">
              <input type="hidden" name="id" value={round.id} />
              <button className="btn-secondary" type="submit">
                Re-fetch from UDisc
              </button>
              <p className="text-xs text-forest-600 mt-1">
                Rebuilds this round from the saved UDisc link — positions, scores, and weather.
              </p>
            </form>
          )}
          <form action={deleteRoundAction}>
            <input type="hidden" name="id" value={round.id} />
            <button className="text-sm text-red-700 hover:underline" type="submit">
              Delete this round
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function buildSummary(r: {
  date: string;
  courseName?: string;
  season: number;
  patchMsg: string;
  results: { pos: number; name: string; points: number; score?: number; relativeScore?: number }[];
}): string {
  const medals = ["🥇", "🥈", "🥉"];
  const lines: string[] = [];
  lines.push(`🥏 ${r.date}${r.courseName ? ` @ ${r.courseName}` : ""}`);
  for (const row of r.results) {
    const medal = medals[row.pos - 1] ?? `${row.pos}.`;
    const extras: string[] = [];
    if (row.relativeScore != null) {
      const sign = row.relativeScore > 0 ? "+" : "";
      extras.push(row.score != null ? `${sign}${row.relativeScore} (${row.score})` : `${sign}${row.relativeScore}`);
    } else if (row.score != null) {
      extras.push(`${row.score}`);
    }
    extras.push(`+${fmtPoints(row.points)} pts`);
    lines.push(`${medal} ${row.name} (${extras.join(" · ")})`);
  }
  lines.push("");
  lines.push(r.patchMsg);
  return lines.join("\n");
}
