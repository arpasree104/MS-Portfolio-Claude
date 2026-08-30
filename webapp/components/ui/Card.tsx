import clsx from "clsx";

export function Card({
  children,
  className,
  title,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={clsx("card", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 gap-3">
          {title && (
            <h3 className="font-semibold text-foreground pl-3 border-l-4 border-primary leading-tight">
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  sublabel,
  tone = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  tone?: "primary" | "green" | "yellow" | "red" | "blue";
}) {
  const toneClasses: Record<string, string> = {
    primary: "bg-primary-50 text-primary",
    green: "bg-status-green/10 text-status-green",
    yellow: "bg-status-yellow/10 text-status-yellow-text",
    red: "bg-status-red/10 text-status-red",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="card flex items-center gap-4">
      <div className={clsx("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", toneClasses[tone])}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-foreground/60">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
        {sublabel && <p className="text-xs text-foreground/50 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}
