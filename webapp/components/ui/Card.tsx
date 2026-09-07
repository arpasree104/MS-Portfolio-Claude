import clsx from "clsx";

export type CardTone = "primary" | "green" | "yellow" | "red" | "blue";

// A soft pastel wash for the whole card (not just an icon chip), with a matching left
// accent bar, so related boxes on a dashboard can be grouped by color at a glance.
const CARD_TONE_CLASSES: Record<CardTone, string> = {
  primary: "bg-primary-50/60 border-l-4 border-l-primary/40",
  green: "bg-status-green/[0.06] border-l-4 border-l-status-green/40",
  yellow: "bg-status-yellow/[0.08] border-l-4 border-l-status-yellow/50",
  red: "bg-status-red/[0.06] border-l-4 border-l-status-red/40",
  blue: "bg-blue-50/70 border-l-4 border-l-blue-300",
};

export function Card({
  children,
  className,
  title,
  action,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  /** Optional pastel background + accent bar, to visually group this card with others
   *  of the same tone (e.g. all academic-related cards in green). Omit for the plain
   *  white card used everywhere by default. */
  tone?: CardTone;
}) {
  return (
    <div className={clsx("card", tone && CARD_TONE_CLASSES[tone], className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 gap-3">
          {title && (
            <h3 className={clsx("font-semibold text-foreground leading-tight", !tone && "pl-3 border-l-4 border-primary")}>
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
  tone?: CardTone;
}) {
  const iconToneClasses: Record<CardTone, string> = {
    primary: "bg-white/70 text-primary",
    green: "bg-white/70 text-status-green",
    yellow: "bg-white/70 text-status-yellow-text",
    red: "bg-white/70 text-status-red",
    blue: "bg-white/70 text-blue-600",
  };

  return (
    <div className={clsx("card flex items-center gap-4", CARD_TONE_CLASSES[tone])}>
      <div className={clsx("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm", iconToneClasses[tone])}>
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
