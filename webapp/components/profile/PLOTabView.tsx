"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { gasCall } from "@/lib/gas-client";
import type { CompetencyLevel, PLOAssessment, PLOWithAssessment } from "@/lib/types";

const LEVELS: CompetencyLevel[] = ["เริ่มต้น", "กำลังพัฒนา", "บรรลุ", "สูงกว่าเกณฑ์"];
const LEVEL_TONE: Record<CompetencyLevel, "gray" | "yellow" | "green" | "primary"> = {
  "เริ่มต้น": "gray",
  "กำลังพัฒนา": "yellow",
  "บรรลุ": "green",
  "สูงกว่าเกณฑ์": "primary",
};

export function PLOTabView({
  studentId,
  initialPlos,
  canEditStudent,
  canEditAdvisor,
}: {
  studentId: string;
  initialPlos: PLOWithAssessment[];
  canEditStudent: boolean;
  canEditAdvisor: boolean;
}) {
  const [plos, setPlos] = useState(initialPlos);
  const [saving, setSaving] = useState<string | null>(null);

  async function updateField(plo: PLOWithAssessment, field: string, value: string) {
    setSaving(plo.plo);
    try {
      const data: Partial<PLOAssessment> = {
        AssessmentId: plo.assessment?.AssessmentId ?? undefined,
        PLO: plo.plo,
        CompetencyLevel: (field === "CompetencyLevel" ? value : plo.assessment?.CompetencyLevel || "เริ่มต้น") as CompetencyLevel,
        EvidenceDescription: field === "EvidenceDescription" ? value : plo.assessment?.EvidenceDescription || "",
        StudentReflection: field === "StudentReflection" ? value : plo.assessment?.StudentReflection || "",
        AdvisorComment: field === "AdvisorComment" ? value : plo.assessment?.AdvisorComment || "",
      };
      const assessmentId = await gasCall<string>("upsertPLOAssessment", { studentId, data });
      setPlos((prev) =>
        prev.map((p) =>
          p.plo === plo.plo
            ? { ...p, assessment: { ...(p.assessment as PLOAssessment), ...data, AssessmentId: assessmentId } }
            : p
        )
      );
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      {plos.map((p) => (
        <Card key={p.plo} title={`${p.plo}: ${p.nameTH}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
            {LEVELS.map((level) => (
              <button
                key={level}
                disabled={!canEditStudent || saving === p.plo}
                onClick={() => updateField(p, "CompetencyLevel", level)}
                className={`text-left ${p.assessment?.CompetencyLevel === level ? "" : "opacity-40"}`}
              >
                <Badge tone={LEVEL_TONE[level]}>{level}</Badge>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <label className="block">
              <span className="text-xs font-medium text-foreground/60 mb-1 block">คำอธิบายหลักฐาน</span>
              <textarea
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                rows={2}
                disabled={!canEditStudent}
                defaultValue={p.assessment?.EvidenceDescription || ""}
                onBlur={(e) => updateField(p, "EvidenceDescription", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-foreground/60 mb-1 block">ผลสะท้อนคิดของนักศึกษา</span>
              <textarea
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                rows={2}
                disabled={!canEditStudent}
                defaultValue={p.assessment?.StudentReflection || ""}
                onBlur={(e) => updateField(p, "StudentReflection", e.target.value)}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs font-medium text-foreground/60 mb-1 block">ความเห็นของอาจารย์</span>
              <textarea
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                rows={2}
                disabled={!canEditAdvisor}
                defaultValue={p.assessment?.AdvisorComment || ""}
                onBlur={(e) => updateField(p, "AdvisorComment", e.target.value)}
              />
            </label>
          </div>
          {p.assessment?.AssessedDate && (
            <p className="text-xs text-foreground/40 mt-2">ประเมินล่าสุด: {new Date(p.assessment.AssessedDate).toLocaleDateString("th-TH")}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
