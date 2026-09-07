"use client";
import { signOut } from "next-auth/react";
import { Bell, ChevronDown, LogOut, Menu, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Role } from "@/lib/types";

const ROLE_LABELS: Record<Role, string> = {
  student: "นักศึกษา",
  advisor: "อาจารย์ที่ปรึกษา",
  executive: "ผู้บริหารหลักสูตร",
  admin: "ผู้ดูแลระบบ",
};

export function Topbar({
  name,
  role,
  unreadCount = 0,
  onOpenMobile,
  sidebarCollapsed,
  onExpandSidebar,
}: {
  name: string;
  role: Role;
  unreadCount?: number;
  onOpenMobile?: () => void;
  sidebarCollapsed?: boolean;
  onExpandSidebar?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  function handleRefresh() {
    startRefresh(() => router.refresh());
  }

  return (
    <header className="no-print h-16 shrink-0 border-b border-black/5 bg-surface flex items-center justify-between md:justify-end gap-2 md:gap-4 px-4 md:px-6">
      <button
        onClick={onOpenMobile}
        className="text-foreground/60 hover:text-foreground md:hidden"
        aria-label="เปิดเมนู"
      >
        <Menu size={22} />
      </button>

      {sidebarCollapsed && (
        <button
          onClick={onExpandSidebar}
          className="hidden md:flex items-center justify-center h-9 w-9 rounded-lg border border-black/10 bg-black/[0.02] text-foreground/70 hover:bg-primary hover:text-white hover:border-primary transition-colors mr-auto"
          aria-label="แสดงเมนู"
          title="แสดงเมนู"
        >
          <Menu size={18} />
        </button>
      )}

      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-foreground/60 hover:text-foreground disabled:opacity-50"
          aria-label="โหลดข้อมูลล่าสุด"
          title="โหลดข้อมูลล่าสุด"
        >
          <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
        </button>

        <button className="relative text-foreground/60 hover:text-foreground">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-status-red text-white text-[10px] flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 md:gap-2 rounded-full bg-primary text-white pl-3 md:pl-4 pr-2 py-2 text-xs md:text-sm font-medium max-w-[45vw] md:max-w-none"
          >
            <span className="truncate">{name} | {ROLE_LABELS[role]}</span>
            <ChevronDown size={16} className="shrink-0" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-card border border-black/10 py-1 z-20">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground/70 hover:bg-black/5"
              >
                <LogOut size={16} />
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
