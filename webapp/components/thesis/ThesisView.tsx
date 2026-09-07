"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ThesisStepper } from "./ThesisStepper";
import { ThesisStepDetail } from "./ThesisStepDetail";
import { onTrackStatusToTone } from "@/lib/status-colors";
import { gasCall } from "@/lib/gas-client";
import type { ThesisDetail, ThesisStepView } from "@/lib/types";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/Modal";

export function ThesisView({
  studentId,
  initialDetail,
  canCertify,
  canEditDetail,
  canStartThesis,
  cohortChart,
}: {
  studentId: string;
  initialDetail: ThesisDetail | null;
  canCertify: boolean;
  canEditDetail: boolean;
  canStartThesis: boolean;
  cohortChart: { cohort: string; total: number; completed: number; inProgress: number; notStarted: number }[];
}) {
  const [detail, setDetail] = useState(initialDetail);
  const [activeStep, setActiveStep] = useState(initialDetail?.thesis.CurrentStep || 1);
  const [createOpen, setCreateOpen] = useState(false);
  const form = useForm<{ TitleTH: string; TitleEN: string }>();

  async function createThesis(data: { TitleTH: string; TitleEN: string }) {
    await gasCall("createThesis", { studentId, data });
    const fresh = await gasCall<ThesisDetail>("getThesisByStudent", { studentId });
    setDetail(fresh);
    setCreateOpen(false);
  }

  function handleStepUpdated(updated: ThesisStepView) {
    if (!detail) return;
    setDetail({
      ...detail,
      steps: detail.steps.map((s) => (s.step === updated.step ? updated : s)),
    });
  }

  if (!detail) {
    return (
      <Card title="ยังไม่มีข้อมูลวิทยานิพนธ์">
        <p className="text-sm text-foreground/60 mb-4">นักศึกษายังไม่ได้เริ่มบันทึกข้อมูลวิทยานิพนธ์</p>
        {canStartThesis && <Button onClick={() => setCreateOpen(true)}>เริ่มบันทึกวิทยานิพนธ์</Button>}
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="เริ่มบันทึกวิทยานิพนธ์">
          <form onSubmit={form.handleSubmit(createThesis)} className="space-y-3">
            <label className="block text-sm">ชื่อวิทยานิพนธ์ (ไทย)
              <input className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm mt-1" {...form.register("TitleTH", { required: true })} />
            </label>
            <label className="block text-sm">ชื่อวิทยานิพนธ์ (อังกฤษ)
              <input className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm mt-1" {...form.register("TitleEN")} />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)} disabled={form.formState.isSubmitting}>ยกเลิก</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "กำลังบันทึก..." : "เริ่มบันทึก"}</Button>
            </div>
          </form>
        </Modal>
      </Card>
    );
  }

  const activeStepData = detail.steps.find((s) => s.step === activeStep)!;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">{detail.thesis.TitleTH || "(ยังไม่ได้ตั้งชื่อวิทยานิพนธ์)"}</h2>
            {detail.thesis.TitleEN && <p className="text-sm text-foreground/50">{detail.thesis.TitleEN}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{detail.thesis.OverallProgressPercent}%</span>
            <Badge tone={onTrackStatusToTone(detail.thesis.OnTrackStatus)}>{detail.thesis.OnTrackStatus}</Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <ThesisStepper steps={detail.steps} activeStep={activeStep} onSelect={setActiveStep} />
        <ThesisStepDetail
          thesisId={detail.thesis.ThesisId}
          step={activeStepData}
          canCertify={canCertify}
          canEditDetail={canEditDetail}
          onUpdated={handleStepUpdated}
        />
      </div>

      {cohortChart.length > 0 && (
        <Card title="ความคืบหน้าวิทยานิพนธ์ตามรุ่น">
          <div className="space-y-3">
            {cohortChart.map((c) => (
              <div key={c.cohort}>
                <div className="flex justify-between text-xs text-foreground/60 mb-1">
                  <span>รุ่น {c.cohort} (n={c.total})</span>
                </div>
                <div className="h-3 w-full rounded-full overflow-hidden bg-black/5 flex">
                  <div className="bg-status-green" style={{ width: `${(c.completed / c.total) * 100}%` }} />
                  <div className="bg-status-yellow" style={{ width: `${(c.inProgress / c.total) * 100}%` }} />
                  <div className="bg-status-gray" style={{ width: `${(c.notStarted / c.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
