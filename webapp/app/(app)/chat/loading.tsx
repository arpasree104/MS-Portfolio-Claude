import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="card p-0 overflow-hidden flex h-[calc(100vh-140px)]">
      <div className="w-64 shrink-0 border-r border-black/5 flex flex-col items-center justify-center gap-2 text-foreground/40">
        <Loader2 size={24} className="animate-spin text-primary" />
        <p className="text-xs">กำลังโหลดรายชื่อ...</p>
      </div>
      <div className="flex-1 flex items-center justify-center text-foreground/40 text-sm">
        กำลังโหลดข้อมูลแชท...
      </div>
    </div>
  );
}
