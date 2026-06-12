import { SkeletonCard, SkeletonHeader } from "@/components/PageSkeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <SkeletonHeader />
      <div className="grid gap-6 sm:grid-cols-2">
        <SkeletonCard lines={6} />
        <SkeletonCard lines={6} />
      </div>
    </div>
  );
}
