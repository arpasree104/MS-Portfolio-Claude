"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { TopProgressBar } from "./TopProgressBar";
import type { Role } from "@/lib/types";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

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

  // Remember the collapsed/expanded preference across reloads and new tabs.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      // ignore (private browsing / storage blocked)
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <TopProgressBar />
      <Sidebar
        role={role}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          name={name}
          role={role}
          onOpenMobile={() => setMobileOpen(true)}
          sidebarCollapsed={collapsed}
          onExpandSidebar={toggleCollapsed}
        />
        <main className="flex-1 p-4 md:p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
