import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-foreground/50">
      <Loader2 size={32} className="animate-spin mb-3 text-primary" />
      <p className="text-sm font-medium">กำลังสร้างรายงาน...</p>
      <p className="text-xs text-foreground/40 mt-1">กำลังดึงข้อมูลผลการเรียน ผลงาน และวิทยานิพนธ์</p>
    </div>
  );
}
