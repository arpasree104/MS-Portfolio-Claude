import { SkeletonStatRow, SkeletonTable } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonStatRow count={5} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><SkeletonTable /></div>
        <SkeletonTable rows={4} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonTable />
        <SkeletonTable rows={4} />
      </div>
    </div>
  );
}
