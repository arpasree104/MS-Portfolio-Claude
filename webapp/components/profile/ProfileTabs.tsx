"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { key: "info", label: "ข้อมูลส่วนตัว" },
  { key: "academic", label: "ผลการเรียน" },
  { key: "plo", label: "PLO" },
  { key: "portfolio", label: "ผลงาน" },
  { key: "advising", label: "การให้คำปรึกษา" },
];

export function ProfileTabs({ studentId }: { studentId: string }) {
  const pathname = usePathname();

  return (
    <div className="border-b border-black/10 flex gap-1 overflow-x-auto">
      {TABS.map((tab) => {
        const href = tab.key === "info"
          ? `/students/${studentId}/profile`
          : `/students/${studentId}/profile/${tab.key}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.key}
            href={href}
            className={clsx(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              active ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
