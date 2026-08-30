import { SkeletonCard } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <SkeletonCard lines={7} />
      <SkeletonCard lines={4} />
    </div>
  );
}
