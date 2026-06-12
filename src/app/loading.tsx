import { SkeletonBlock, SkeletonCard } from "@/components/PageSkeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="h-7 w-36 animate-pulse rounded bg-forest-100" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonBlock className="h-32" />
          <SkeletonBlock className="h-32" />
        </div>
      </div>
      <SkeletonCard lines={2} />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3"><SkeletonCard lines={8} /></div>
        <div className="lg:col-span-2"><SkeletonCard lines={6} /></div>
      </div>
    </div>
  );
}
