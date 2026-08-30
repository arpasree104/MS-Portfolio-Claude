import { TONE_CLASSES, type StatusTone } from "@/lib/status-colors";
import clsx from "clsx";

export function Badge({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  const t = TONE_CLASSES[tone];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border",
        t.bg,
        t.text,
        t.border,
        className
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", t.dot)} />
      {children}
    </span>
  );
}
