"use client";
import { Loader2 } from "lucide-react";

/** Full-screen, non-dismissible overlay for long-running actions where the user must not click again. */
export function BlockingOverlay({ open, message }: { open: boolean; message: string }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-surface rounded-card shadow-card px-8 py-8 flex flex-col items-center gap-4 max-w-sm text-center">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">{message}</p>
        <p className="text-xs text-foreground/50">กรุณารอสักครู่ อย่าปิดหน้าต่างนี้</p>
      </div>
    </div>
  );
}
