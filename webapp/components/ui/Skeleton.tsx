import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse bg-black/10 rounded", className)} />;
}

export function SkeletonStatRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card">
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard({ lines = 4 }: { lines?: number }) {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-5 w-32" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-4">
      <SkeletonStatRow />
      <SkeletonTable />
    </div>
  );
}
