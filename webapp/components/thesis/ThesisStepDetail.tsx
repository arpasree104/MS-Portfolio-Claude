"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { gasCall } from "@/lib/gas-client";
import type { ThesisStepView } from "@/lib/types";

const inputClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

// Step-specific extra detail fields, per Requirement section 4 (steps 1-8).
const STEP_DETAIL_FIELDS: Record<number, { key: string; label: string; type: "text" | "date" | "number" }[]> = {
  1: [
    { key: "titleTH", label: "ชื่อวิทยานิพนธ์ (ไทย)", type: "text" },
    { key: "titleEN", label: "ชื่อวิทยานิพนธ์ (อังกฤษ)", type: "text" },
    { key: "researchQuestion", label: "คำถาม/วัตถุประสงค์การวิจัย", type: "text" },
    { key: "researchDesign", label: "รูปแบบการวิจัย", type: "text" },
    { key: "committee", label: "รายชื่ออาจารย์ที่ปรึกษาและกรรมการ", type: "text" },
  ],
  2: [
    { key: "examDate", label: "วันที่สอบ", type: "date" },
    { key: "committeeNames", label: "รายชื่อกรรมการ", type: "text" },
    { key: "examResult", label: "ผลการสอบ (ผ่าน/ผ่านมีเงื่อนไข/ไม่ผ่าน)", type: "text" },
    { key: "revisionDueDate", label: "กำหนดส่งฉบับแก้ไข", type: "date" },
  ],
  3: [
    { key: "ethicsApprovalNumber", label: "เลขที่โครงการจริยธรรม", type: "text" },
    { key: "ethicsApprovalDate", label: "วันที่รับรอง", type: "date" },
    { key: "ethicsExpiryDate", label: "วันหมดอายุการรับรอง", type: "date" },
    { key: "dataCollectionStartDate", label: "วันเริ่มเก็บข้อมูล", type: "date" },
    { key: "dataCollectionEndDate", label: "วันสิ้นสุดเก็บข้อมูล", type: "date" },
    { key: "targetSampleSize", label: "จำนวนกลุ่มตัวอย่างตามแผน", type: "number" },
    { key: "actualSampleSize", label: "จำนวนกลุ่มตัวอย่างที่เก็บได้จริง", type: "number" },
  ],
  4: [
    { key: "formatCheckStatus", label: "การตรวจรูปแบบเบื้องต้น", type: "text" },
    { key: "plagiarismCheckResult", label: "ผลการตรวจความซ้ำซ้อน", type: "text" },
    { key: "examRequestDate", label: "วันที่เสนอสอบ", type: "date" },
    { key: "examDate", label: "วันสอบ", type: "date" },
  ],
  5: [
    { key: "examDateTime", label: "วัน เวลา สถานที่สอบ", type: "text" },
    { key: "committeeNames", label: "รายชื่อกรรมการสอบ", type: "text" },
    { key: "examResult", label: "ผลการสอบ", type: "text" },
    { key: "revisionDueDate", label: "กำหนดส่งฉบับแก้ไข", type: "date" },
  ],
  6: [
    { key: "formatCheckStatus", label: "สถานะการตรวจรูปแบบ", type: "text" },
    { key: "revisionRounds", label: "จำนวนรอบที่ส่งแก้ไข", type: "number" },
    { key: "plagiarismCheckResult", label: "ผลการตรวจความซ้ำซ้อน", type: "text" },
  ],
  7: [
    { key: "submissionDate", label: "วันที่ส่งเข้าระบบ TU e-Thesis", type: "date" },
    { key: "approvalStatus", label: "สถานะการอนุมัติ", type: "text" },
    { key: "thesisRegistryLink", label: "ลิงก์ระเบียนวิทยานิพนธ์", type: "text" },
  ],
  8: [
    { key: "englishPassed", label: "ผลภาษาอังกฤษผ่านเกณฑ์", type: "text" },
    { key: "gpaxPassed", label: "GPAX ผ่านเกณฑ์", type: "text" },
    { key: "publicationEvidence", label: "ผลงานได้รับการตีพิมพ์/ตอบรับ/นำเสนอ", type: "text" },
    { key: "graduationRequestDate", label: "วันที่ยื่นขอสำเร็จการศึกษา", type: "date" },
    { key: "graduationApprovalDate", label: "วันที่อนุมัติสำเร็จการศึกษา", type: "date" },
  ],
};

export function ThesisStepDetail({
  thesisId,
  step,
  canCertify,
  canEditDetail,
  onUpdated,
}: {
  thesisId: string;
  step: ThesisStepView;
  canCertify: boolean;
  canEditDetail: boolean;
  onUpdated: (updated: ThesisStepView) => void;
}) {
  const [detail, setDetail] = useState<Record<string, unknown>>(step.detail || {});
  const [plannedDate, setPlannedDate] = useState(step.plannedDate || "");
  const [actualDate, setActualDate] = useState(step.actualDate || "");
  const [saving, setSaving] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ base64: string; name: string; mime: string } | null>(null);

  const fields = STEP_DETAIL_FIELDS[step.step] || [];

  async function save(newStatus?: string) {
    setSaving(true);
    try {
      const patch: Record<string, unknown> = {
        PlannedDate: plannedDate,
        ActualDate: actualDate,
        detail,
      };
      if (newStatus) patch.Status = newStatus;
      if (fileInfo) {
        detail.evidenceFileBase64 = fileInfo.base64;
        detail.evidenceFileName = fileInfo.name;
      }

      const result = await gasCall<{ steps: ThesisStepView[] }>("upsertThesisStep", { thesisId, stepNumber: step.step, patch });
      const updated = result.steps.find((s) => s.step === step.step);
      if (updated) onUpdated(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title={`รายละเอียดขั้นตอนที่ ${step.step}: ${step.nameTH}`}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="text-sm">วันที่ตามแผน
          <input type="date" className={inputClass} value={plannedDate} disabled={!canEditDetail} onChange={(e) => setPlannedDate(e.target.value)} />
        </label>
        <label className="text-sm">วันที่ดำเนินการจริง
          <input type="date" className={inputClass} value={actualDate} disabled={!canEditDetail} onChange={(e) => setActualDate(e.target.value)} />
        </label>
      </div>

      {fields.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {fields.map((f) => (
            <label key={f.key} className="text-sm">
              {f.label}
              <input
                type={f.type}
                className={inputClass}
                disabled={!canEditDetail}
                value={(detail[f.key] as string) ?? ""}
                onChange={(e) => setDetail((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
      )}

      {canEditDetail && (
        <div className="mb-4">
          <span className="text-xs font-medium text-foreground/60 mb-1 block">เอกสารประกอบ</span>
          <FileUpload onFileReady={(base64, name, mime) => setFileInfo({ base64, name, mime })} />
        </div>
      )}

      <div className="flex justify-end gap-2">
        {canEditDetail && (
          <Button variant="secondary" onClick={() => save()} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        )}
        {canCertify && step.status !== "สำเร็จ" && (
          <Button onClick={() => save("สำเร็จ")} disabled={saving}>
            รับรองขั้นตอน
          </Button>
        )}
        {canEditDetail && step.status === "รอดำเนินการ" && (
          <Button variant="secondary" onClick={() => save("กำลังดำเนินการ")} disabled={saving}>
            เริ่มดำเนินการ
          </Button>
        )}
      </div>
    </Card>
  );
}
