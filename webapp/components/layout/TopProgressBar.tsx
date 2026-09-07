"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isFirstRender = useRef(true);

  // A route change has completed once pathname/searchParams settle on their new value
  // (this effect re-runs), so use that as the "finish" signal for a bar we started
  // eagerly on click (see the capture-phase listener below).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setWidth(100);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 200);
    timers.current.push(hideTimer);
    return () => clearTimeout(hideTimer);
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest("a[href]");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || target.hasAttribute("target") || target.hasAttribute("download")) return;

      timers.current.forEach(clearTimeout);
      timers.current = [];
      setVisible(true);
      setWidth(20);
      timers.current.push(setTimeout(() => setWidth(55), 150));
      timers.current.push(setTimeout(() => setWidth(75), 500));
      // Safety net: if navigation never completes (error, same-URL link), don't leave
      // the bar stuck forever.
      timers.current.push(setTimeout(() => { setVisible(false); setWidth(0); }, 8000));
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent no-print">
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
