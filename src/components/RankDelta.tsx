export function RankDelta({ delta }: { delta: number | null }) {
  if (delta == null) return null;
  if (delta === 0) return <span className="text-xs text-forest-400">—</span>;
  if (delta > 0) return <span className="text-xs font-semibold text-emerald-700">↑{delta}</span>;
  return <span className="text-xs font-semibold text-red-600">↓{Math.abs(delta)}</span>;
}
