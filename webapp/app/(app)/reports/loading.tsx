import { SkeletonStatRow, SkeletonTable } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonStatRow />
      <SkeletonTable />
      <SkeletonTable rows={4} />
    </div>
  );
}
