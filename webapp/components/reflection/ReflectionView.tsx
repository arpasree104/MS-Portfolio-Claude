"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { gasCall } from "@/lib/gas-client";
import type { ProgressEvaluation, Reflection } from "@/lib/types";

const REFLECTION_QUESTIONS: { key: keyof Reflection; label: string }[] = [
  { key: "Q1_GoalsAchieved", label: "1. ภาคการศึกษานี้ฉันบรรลุเป้าหมายใดบ้าง" },
  { key: "Q2_BestWork", label: "2. ผลงานใดแสดงพัฒนาการของฉันได้ดีที่สุด" },
  { key: "Q3_Problems", label: "3. ฉันพบปัญหาหรืออุปสรรคอะไร" },
  { key: "Q4_HowSolved", label: "4. ฉันจัดการกับปัญหานั้นอย่างไร" },
  { key: "Q5_CompetenciesToImprove", label: "5. สมรรถนะใดที่ยังต้องพัฒนา" },
  { key: "Q6_SupportNeeded", label: "6. ฉันต้องการการสนับสนุนจากอาจารย์หรือหลักสูตรด้านใด" },
  { key: "Q7_NextSemesterPlan", label: "7. เป้าหมายและแผนดำเนินงานในภาคการศึกษาถัดไปคืออะไร" },
];

const inputClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

export function ReflectionView({
  studentId,
  initialReflections,
  initialEvaluation,
  academicYear,
  semester,
  isStudent,
  isAdvisor,
}: {
  studentId: string;
  initialReflections: Reflection[];
  initialEvaluation: ProgressEvaluation[];
  academicYear: string;
  semester: string;
  isStudent: boolean;
  isAdvisor: boolean;
}) {
  const [reflections, setReflections] = useState(initialReflections);
  const [evaluation, setEvaluation] = useState(initialEvaluation);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const form = useForm<Record<string, string>>({
    defaultValues: { AcademicYear: academicYear, Semester: semester },
  });

  function flash(msg: string) {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(null), 3000);
  }

  async function submitReflection(data: Record<string, string>) {
    await gasCall("createReflection", { studentId, data: { ...data, AcademicYear: academicYear, Semester: semester } });
    setReflections((prev) => [{ ...data, ReflectionId: crypto.randomUUID(), StudentId: studentId, CreatedAt: new Date().toISOString() } as unknown as Reflection, ...prev]);
    flash("บันทึกการสะท้อนคิดแล้ว");
    form.reset();
  }

  async function updateEvalLevel(aspect: string, field: "SelfLevel" | "AdvisorLevel", level: string) {
    const data = { AcademicYear: academicYear, Semester: semester, Aspect: aspect, [field]: level };
    await gasCall("upsertProgressEvaluation", { studentId, data });
    setEvaluation((prev) => prev.map((e) => (e.Aspect === aspect ? { ...e, [field]: level } : e)));
    flash("บันทึกผลประเมินแล้ว");
  }

  return (
    <div className="space-y-4">
      {savedMsg && <div className="rounded-lg bg-status-green/10 text-status-green text-sm px-4 py-2">{savedMsg}</div>}

      {isStudent && (
        <Card title="แบบสะท้อนคิดและแผนพัฒนารายบุคคล">
          <form onSubmit={form.handleSubmit(submitReflection)} className="space-y-4">
            {REFLECTION_QUESTIONS.map((q) => (
              <label key={q.key} className="block text-sm">
                {q.label}
                <textarea className={inputClass} rows={2} {...form.register(q.key)} />
              </label>
            ))}
            <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "กำลังบันทึก..." : "บันทึกการสะท้อนคิด"}</Button>
          </form>
        </Card>
      )}

      <Card title="ประวัติการสะท้อนคิด">
        <div className="space-y-3">
          {reflections.map((r) => (
            <div key={r.ReflectionId} className="border border-black/5 rounded-lg p-4 text-sm space-y-1">
              <p className="text-xs text-foreground/50 mb-2">ปีการศึกษา {r.AcademicYear} ภาคเรียนที่ {r.Semester}</p>
              {REFLECTION_QUESTIONS.map((q) => r[q.key] && (
                <p key={q.key}><span className="text-foreground/50">{q.label.replace(/^\d+\.\s*/, "")}:</span> {r[q.key] as string}</p>
              ))}
            </div>
          ))}
          {reflections.length === 0 && <p className="text-center text-foreground/40 py-6 text-sm">ยังไม่มีการบันทึกสะท้อนคิด</p>}
        </div>
      </Card>

      <Card title={`แบบประเมินความก้าวหน้า ปีการศึกษา ${academicYear} ภาคเรียนที่ ${semester}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-foreground/60 border-b border-black/10">
                <th className="py-2 px-2">ด้านที่ประเมิน</th>
                <th className="py-2 px-2">ระดับตนเอง</th>
                <th className="py-2 px-2">ระดับอาจารย์</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.map((e) => (
                <tr key={e.Aspect} className="border-b border-black/5">
                  <td className="py-2 px-2">{e.Aspect}</td>
                  <td className="py-2 px-2">
                    <LevelPicker value={e.SelfLevel} disabled={!isStudent} onChange={(v) => updateEvalLevel(e.Aspect, "SelfLevel", v)} />
                  </td>
                  <td className="py-2 px-2">
                    <LevelPicker value={e.AdvisorLevel} disabled={!isAdvisor} onChange={(v) => updateEvalLevel(e.Aspect, "AdvisorLevel", v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-foreground/50 mt-3">เกณฑ์ระดับ: 4 = บรรลุเกินกว่าเป้าหมาย, 3 = บรรลุเป้าหมาย, 2 = กำลังพัฒนาและต้องติดตาม, 1 = ต้องได้รับการช่วยเหลือเร่งด่วน</p>
      </Card>
    </div>
  );
}

function LevelPicker({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1">
      {["1", "2", "3", "4"].map((lvl) => (
        <button
          key={lvl}
          disabled={disabled}
          onClick={() => onChange(lvl)}
          className={`h-7 w-7 rounded-full text-xs font-medium border ${
            value === lvl ? "bg-primary text-white border-primary" : "border-black/10 text-foreground/50 hover:bg-black/5"
          } disabled:cursor-default`}
        >
          {lvl}
        </button>
      ))}
    </div>
  );
}
