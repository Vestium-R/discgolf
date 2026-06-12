import { SkeletonCard, SkeletonHeader } from "@/components/PageSkeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <SkeletonHeader />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={3} />
      <SkeletonCard lines={8} />
    </div>
  );
}
