import clsx from "clsx";
import { TONE_CLASSES, type StatusTone } from "@/lib/status-colors";

export function ProgressBar({
  percent,
  tone = "green",
  label,
  className,
}: {
  percent: number;
  tone?: StatusTone;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const dotClass = TONE_CLASSES[tone].dot;

  return (
    <div className={clsx("w-full", className)}>
      <div className="h-2.5 w-full rounded-full bg-black/5 overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all", dotClass)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {label && <p className="text-xs text-foreground/60 mt-1">{label}</p>}
    </div>
  );
}
