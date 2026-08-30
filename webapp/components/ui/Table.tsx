import clsx from "clsx";

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className={clsx("w-full text-sm", className)}>{children}</table>
    </div>
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
