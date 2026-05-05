import { runDataIntegrityChecks } from "@/lib/store";
import { prettyDate } from "@/lib/format";

export async function IntegrityPanel() {
  let report;
  let error: string | null = null;

  try {
    report = await runDataIntegrityChecks();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error) {
    return (
      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-red-700">Data Integrity</summary>
        <div className="mt-3 text-sm text-red-600">Error: {error}</div>
      </details>
    );
  }

  if (!report) {
    return (
      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-red-700">Data Integrity</summary>
        <div className="mt-3 text-sm text-red-600">No data available</div>
      </details>
    );
  }

  const isHealthy =
    report.playersWithInvalidId === 0 &&
    report.orphanedRoundResultCount === 0 &&
    report.roundsWithMixedIds === 0 &&
    report.orphanedChampionIds === 0 &&
    report.orphanedBadgeHolderIds === 0 &&
    report.bagDiscsWithInvalidUserId === 0;

  const metrics = [
    { label: "Players", value: report.playerCount, good: report.playerCount > 0 },
    { label: "Players with UUID", value: report.playersWithUUID, good: report.playersWithUUID === report.playerCount },
    { label: "Invalid player IDs", value: report.playersWithInvalidId, good: report.playersWithInvalidId === 0 },
    { label: "Rounds", value: report.roundCount, good: report.roundCount >= 0 },
    { label: "Orphaned round results", value: report.orphanedRoundResultCount, good: report.orphanedRoundResultCount === 0 },
    { label: "Rounds with mixed ID formats", value: report.roundsWithMixedIds, good: report.roundsWithMixedIds === 0 },
    { label: "Season history records", value: report.seasonHistoryCount, good: report.seasonHistoryCount >= 0 },
    { label: "Orphaned champion IDs", value: report.orphanedChampionIds, good: report.orphanedChampionIds === 0 },
    { label: "Orphaned badge holder IDs", value: report.orphanedBadgeHolderIds, good: report.orphanedBadgeHolderIds === 0 },
    { label: "Bag discs", value: report.bagDiscCount, good: report.bagDiscCount >= 0 },
    { label: "Bag discs with invalid user IDs", value: report.bagDiscsWithInvalidUserId, good: report.bagDiscsWithInvalidUserId === 0 },
  ];

  return (
    <details className="card p-4" open>
      <summary className={`cursor-pointer font-semibold ${isHealthy ? "text-green-700" : "text-red-700"}`}>
        Data Integrity {isHealthy ? "✓" : "⚠"}
      </summary>
      <div className="mt-4 space-y-1 text-sm">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between gap-2 py-1">
            <span className="text-forest-600">{m.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{m.value}</span>
              <span className={m.good ? "text-green-600" : "text-red-600"}>{m.good ? "✓" : "✗"}</span>
            </div>
          </div>
        ))}
        <div className="border-t border-forest-200 pt-2 mt-2 text-xs text-forest-500">Checked at {prettyDate(report.checkedAt)}</div>
      </div>
    </details>
  );
}
