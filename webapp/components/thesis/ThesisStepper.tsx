"use client";
import clsx from "clsx";
import { Check, Clock, Loader2 } from "lucide-react";
import type { ThesisStepView } from "@/lib/types";

export function ThesisStepper({
  steps,
  activeStep,
  onSelect,
}: {
  steps: ThesisStepView[];
  activeStep: number;
  onSelect: (step: number) => void;
}) {
  return (
    <div className="space-y-2">
      {steps.map((step) => {
        const isActive = step.step === activeStep;
        const icon = step.status === "สำเร็จ" ? <Check size={16} /> : step.status === "กำลังดำเนินการ" ? <Loader2 size={16} /> : <Clock size={16} />;
        const toneClass =
          step.status === "สำเร็จ" ? "bg-status-green text-white" :
          step.status === "กำลังดำเนินการ" ? "bg-status-yellow text-white" :
          "bg-black/10 text-foreground/50";

        return (
          <button
            key={step.step}
            onClick={() => onSelect(step.step)}
            className={clsx(
              "w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
              isActive ? "border-primary bg-primary-50" : "border-black/5 hover:bg-black/[0.03]"
            )}
          >
            <span className={clsx("h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0", toneClass)}>
              {step.status === "รอดำเนินการ" ? step.step : icon}
            </span>
            <span className="flex-1 text-sm font-medium">{step.step}. {step.nameTH}</span>
            <span className="text-xs text-foreground/50 shrink-0">
              {step.status}
            </span>
          </button>
        );
      })}
    </div>
  );
}
