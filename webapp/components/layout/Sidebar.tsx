"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutGrid, Users, GraduationCap, Target, FolderOpen, GraduationCap as ThesisIcon,
  MessageSquare, Lightbulb, BarChart3, Settings, Shield, Layers, Sparkles, BookOpen,
  PanelLeftClose, X, MessageCircle,
} from "lucide-react";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutGrid, roles: ["student", "advisor", "executive", "admin"] },
  { href: "/students", label: "นักศึกษาทั้งหมด", icon: Users, roles: ["advisor", "executive", "admin"] },
  { href: "/profile", label: "ประวัตินักศึกษา", icon: Users, roles: ["student"] },
  { href: "/academic", label: "ผลการเรียน", icon: GraduationCap, roles: ["student"] },
  { href: "/plo", label: "ผลลัพธ์การเรียนรู้", icon: Target, roles: ["student"] },
  { href: "/portfolio", label: "แฟ้มผลงาน", icon: FolderOpen, roles: ["student"] },
  { href: "/thesis", label: "วิทยานิพนธ์", icon: ThesisIcon, roles: ["student", "advisor", "executive", "admin"] },
  { href: "/advising", label: "การให้คำปรึกษา", icon: MessageSquare, roles: ["student", "advisor", "executive", "admin"] },
  { href: "/chat", label: "แชท", icon: MessageCircle, roles: ["student", "advisor", "executive", "admin"] },
  { href: "/reflection", label: "Reflection", icon: Lightbulb, roles: ["student", "advisor", "executive", "admin"] },
  { href: "/reports", label: "รายงานผู้บริหาร", icon: BarChart3, roles: ["executive", "admin"] },
  { href: "/admin/users", label: "จัดการผู้ใช้งาน", icon: Shield, roles: ["admin"] },
  { href: "/admin/divisions", label: "จัดการสาขาวิชา", icon: Layers, roles: ["admin"] },
  { href: "/admin/course-catalog", label: "จัดการรายวิชา", icon: BookOpen, roles: ["admin"] },
  { href: "/admin/seed-data", label: "ข้อมูลตัวอย่าง", icon: Sparkles, roles: ["admin"] },
  { href: "/settings", label: "ตั้งค่า", icon: Settings, roles: ["student", "advisor", "executive", "admin"] },
];

export function Sidebar({
  role,
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapsed,
}: {
  role: Role;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden no-print"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={clsx(
          "no-print bg-gradient-to-b from-surface-sidebar to-surface-sidebar-to flex flex-col shrink-0 transition-all duration-200 overflow-hidden shadow-[2px_0_16px_rgba(0,0,0,0.2)]",
          // Mobile: fixed slide-in drawer
          "fixed inset-y-0 left-0 z-40 w-64 -translate-x-full md:translate-x-0",
          mobileOpen && "translate-x-0",
          // Desktop: normal flow sibling, fully collapses to 0 width (not just icons)
          // so a hamburger toggle in the topbar can push it fully out of the way.
          "md:static md:min-h-screen",
          collapsed ? "md:w-0" : "md:w-64"
        )}
      >
        <div className={clsx("flex items-center gap-3 px-4 py-5 border-b border-white/10 w-64", collapsed && "md:opacity-0")}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-primary-dark/30">
            TU
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-tight truncate">M.N.S. Portfolio</p>
            <p className="text-xs text-white/45 truncate">คณะพยาบาลศาสตร์ มธ.</p>
          </div>
          <button
            onClick={onCloseMobile}
            className="ml-auto text-white/60 hover:text-white md:hidden"
            aria-label="ปิดเมนู"
          >
            <X size={20} />
          </button>
          <button
            onClick={onToggleCollapsed}
            className="ml-auto hidden md:flex items-center justify-center h-8 w-8 rounded-lg border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors shrink-0"
            aria-label="ซ่อนเมนู"
            title="ซ่อนเมนู"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto w-64">
          {items.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={clsx(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-gradient-to-r from-surface-sidebar-active to-surface-sidebar-active-to text-white shadow-lg shadow-black/20"
                    : "text-white/60 hover:bg-surface-sidebar-hover hover:text-white"
                )}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-white" />}
                <Icon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
