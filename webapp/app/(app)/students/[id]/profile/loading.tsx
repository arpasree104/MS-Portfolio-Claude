import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <div className="flex-1 flex gap-3 justify-end">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-28 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-4 border-b border-black/10 pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-20" />
        ))}
      </div>
      <SkeletonCard lines={5} />
    </div>
  );
}
