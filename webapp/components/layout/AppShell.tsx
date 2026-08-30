"use client";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { Role } from "@/lib/types";

export function AppShell({
  role,
  name,
  children,
}: {
  role: Role;
  name: string;
  children: React.ReactNode;
}) {
  // Mobile drawer: closed by default (its own fixed/translate-x-full CSS handles hiding
  // on desktop regardless, so no viewport check is needed here). Desktop rail: expanded
  // by default; user can collapse it, and that never affects the mobile drawer state.
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        role={role}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar name={name} role={role} onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
