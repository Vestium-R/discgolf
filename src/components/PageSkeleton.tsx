export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-forest-100 ${className}`} />;
}

export function SkeletonLines({ count = 4 }: { count?: number }) {
  const widths = [100, 90, 80, 85, 95, 75];
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-2.5 animate-pulse rounded bg-forest-100"
          style={{ width: `${widths[i % widths.length]}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonHeader() {
  return (
    <div className="space-y-2">
      <div className="h-7 w-40 animate-pulse rounded bg-forest-100" />
      <div className="h-3.5 w-56 animate-pulse rounded bg-forest-100" />
    </div>
  );
}

export function SkeletonCard({ lines = 4 }: { lines?: number }) {
  return (
    <div className="card p-5">
      <SkeletonLines count={lines} />
    </div>
  );
}
