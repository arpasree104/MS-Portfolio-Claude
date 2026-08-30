import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="card">
        <Skeleton className="h-5 w-56 mb-2" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
        <div className="card space-y-3">
          <Skeleton className="h-5 w-48" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
