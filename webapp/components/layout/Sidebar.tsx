"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutGrid, Users, GraduationCap, Target, FolderOpen, GraduationCap as ThesisIcon,
  MessageSquare, Lightbulb, BarChart3, Settings, Shield, Layers, Sparkles,
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
  { href: "/reflection", label: "Reflection", icon: Lightbulb, roles: ["student", "advisor", "executive", "admin"] },
  { href: "/reports", label: "รายงานผู้บริหาร", icon: BarChart3, roles: ["executive", "admin"] },
  { href: "/admin/users", label: "จัดการผู้ใช้งาน", icon: Shield, roles: ["admin"] },
  { href: "/admin/divisions", label: "จัดการสาขาวิชา", icon: Layers, roles: ["admin"] },
  { href: "/admin/seed-data", label: "ข้อมูลตัวอย่าง", icon: Sparkles, roles: ["admin"] },
  { href: "/settings", label: "ตั้งค่า", icon: Settings, roles: ["student", "advisor", "executive", "admin"] },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 shrink-0 bg-surface-sidebar border-r border-black/5 min-h-screen flex flex-col">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-black/5">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
          TU
        </div>
        <div className="min-w-0">
          <p className="font-bold text-primary text-sm leading-tight truncate">M.N.S. Portfolio</p>
          <p className="text-xs text-foreground/50 truncate">คณะพยาบาลศาสตร์ มธ.</p>
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary text-white" : "text-foreground/70 hover:bg-black/5"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
