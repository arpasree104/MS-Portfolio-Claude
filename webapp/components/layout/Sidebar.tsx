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
  { href: "/chat", label: "แชท", icon: MessageCircle, roles: ["student", "advisor"] },
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
          "no-print bg-surface-sidebar border-r border-black/5 flex flex-col shrink-0 transition-all duration-200 overflow-hidden",
          // Mobile: fixed slide-in drawer
          "fixed inset-y-0 left-0 z-40 w-64 -translate-x-full md:translate-x-0",
          mobileOpen && "translate-x-0",
          // Desktop: normal flow sibling, fully collapses to 0 width (not just icons)
          // so a hamburger toggle in the topbar can push it fully out of the way.
          "md:static md:min-h-screen",
          collapsed ? "md:w-0 md:border-r-0" : "md:w-64"
        )}
      >
        <div className={clsx("flex items-center gap-3 px-4 py-5 border-b border-black/5 w-64", collapsed && "md:opacity-0")}>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            TU
          </div>
          <div className="min-w-0">
            <p className="font-bold text-primary text-sm leading-tight truncate">M.N.S. Portfolio</p>
            <p className="text-xs text-foreground/50 truncate">คณะพยาบาลศาสตร์ มธ.</p>
          </div>
          <button
            onClick={onCloseMobile}
            className="ml-auto text-foreground/50 hover:text-foreground md:hidden"
            aria-label="ปิดเมนู"
          >
            <X size={20} />
          </button>
          <button
            onClick={onToggleCollapsed}
            className="ml-auto hidden md:block text-foreground/50 hover:text-foreground"
            aria-label="ซ่อนเมนู"
            title="ซ่อนเมนู"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto w-64">
          {items.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors border-l-4",
                  active
                    ? "bg-primary text-white border-primary-dark"
                    : "text-foreground/70 hover:bg-black/5 border-transparent"
                )}
              >
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
