"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function RecheckStatusButton() {
  const { update } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  async function recheck() {
    if (checking) return;
    setChecking(true);
    try {
      await update();
      router.refresh();
    } finally {
      setChecking(false);
    }
  }

  return (
    <button
      type="button"
      onClick={recheck}
      disabled={checking}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:opacity-50 mb-4"
    >
      <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
      {checking ? "กำลังตรวจสอบ..." : "ตรวจสอบสถานะอีกครั้ง"}
    </button>
  );
}
