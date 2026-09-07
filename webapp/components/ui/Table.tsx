"use client";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const floatingInnerRef = useRef<HTMLDivElement>(null);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const syncingFrom = useRef<"table" | "floating" | null>(null);

  // A floating horizontal scrollbar pinned to the viewport bottom, mirrored to the
  // table's own scroll container, so a tall/wide table can be scrolled sideways
  // without first scrolling the page down to reach the table's native scrollbar.
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    function updateWidths() {
      if (!scrollEl || !floatingInnerRef.current) return;
      floatingInnerRef.current.style.width = `${scrollEl.scrollWidth}px`;
    }

    function updateVisibility() {
      if (!scrollEl) return;
      const rect = scrollEl.getBoundingClientRect();
      const isOverflowing = scrollEl.scrollWidth > scrollEl.clientWidth + 1;
      const isInView = rect.top < window.innerHeight && rect.bottom > 0;
      setShowFloatingBar(isOverflowing && isInView);
    }

    function onTableScroll() {
      if (syncingFrom.current === "floating") { syncingFrom.current = null; return; }
      if (!floatingRef.current) return;
      syncingFrom.current = "table";
      floatingRef.current.scrollLeft = scrollEl!.scrollLeft;
    }

    updateWidths();
    updateVisibility();

    const resizeObserver = new ResizeObserver(() => { updateWidths(); updateVisibility(); });
    resizeObserver.observe(scrollEl);

    scrollEl.addEventListener("scroll", onTableScroll);
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      resizeObserver.disconnect();
      scrollEl.removeEventListener("scroll", onTableScroll);
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  // Separate effect scoped to the floating bar's own lifetime: it only exists in the
  // DOM while showFloatingBar is true, so its scroll listener must attach/detach
  // alongside that, not inside the effect above (which runs once on mount, before
  // this conditionally-rendered element exists).
  useEffect(() => {
    if (!showFloatingBar) return;
    const floatingEl = floatingRef.current;
    const scrollEl = scrollRef.current;
    const innerEl = floatingInnerRef.current;
    if (!floatingEl || !scrollEl || !innerEl) return;

    innerEl.style.width = `${scrollEl.scrollWidth}px`;
    floatingEl.scrollLeft = scrollEl.scrollLeft;

    function onFloatingScroll() {
      if (syncingFrom.current === "table") { syncingFrom.current = null; return; }
      if (!scrollEl) return;
      syncingFrom.current = "floating";
      scrollEl.scrollLeft = floatingEl!.scrollLeft;
    }

    floatingEl.addEventListener("scroll", onFloatingScroll);
    return () => floatingEl.removeEventListener("scroll", onFloatingScroll);
  }, [showFloatingBar]);

  return (
    <>
      <div ref={scrollRef} className="overflow-x-auto -mx-5 px-5">
        <table className={clsx("w-full text-sm", className)}>{children}</table>
      </div>
      {showFloatingBar && (
        <div
          ref={floatingRef}
          className="no-print fixed bottom-0 left-0 right-0 z-30 overflow-x-auto overflow-y-hidden h-3"
          style={{ scrollbarGutter: "stable" }}
        >
          <div ref={floatingInnerRef} className="h-px" />
        </div>
      )}
    </>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-black/[0.02]">
      <tr className="text-left text-foreground/60 border-b border-black/10">{children}</tr>
    </thead>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={clsx("py-2.5 px-3 font-medium whitespace-nowrap", className)}>{children}</th>;
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={clsx("py-3 px-3 whitespace-nowrap", className)}>{children}</td>;
}

export function Tr({ children, className, highlight }: { children: React.ReactNode; className?: string; highlight?: boolean }) {
  return (
    <tr className={clsx("border-b border-black/5 last:border-0", highlight && "bg-primary-50/40", className)}>
      {children}
    </tr>
  );
}
