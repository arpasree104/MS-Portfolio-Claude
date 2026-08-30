"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { gasCall } from "@/lib/gas-client";
import type { Division } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

export function DivisionSelectView({
  studentId,
  currentDivisionId,
  divisions,
}: {
  studentId: string;
  currentDivisionId?: string;
  divisions: Division[];
}) {
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState(currentDivisionId || "");
  const form = useForm({ defaultValues: { divisionId: currentDivisionId || "" } });

  async function onSubmit(data: { divisionId: string }) {
    await gasCall("setStudentDivision", { studentId, divisionId: data.divisionId });
    setSelected(data.divisionId);
    setSavedMsg("บันทึกสาขาวิชาแล้ว");
    setTimeout(() => setSavedMsg(null), 3000);
  }

  return (
    <Card title="สาขาวิชาที่ศึกษา">
      {!currentDivisionId && !selected && (
        <div className="flex items-start gap-2 rounded-lg bg-status-yellow/10 text-status-yellow-text text-sm px-4 py-3 mb-4">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          กรุณาเลือกสาขาวิชาที่ศึกษาก่อนใช้งานระบบ
        </div>
      )}
      {savedMsg && <div className="rounded-lg bg-status-green/10 text-status-green text-sm px-4 py-2 mb-4">{savedMsg}</div>}
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-3 max-w-md">
        <label className="block text-sm flex-1">
          สาขาวิชา
          <select className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm mt-1" {...form.register("divisionId", { required: true })}>
            <option value="">-- เลือกสาขาวิชา --</option>
            {divisions.map((d) => (
              <option key={d.DivisionId} value={d.DivisionId}>{d.NameTH}</option>
            ))}
          </select>
        </label>
        <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "กำลังบันทึก..." : "บันทึก"}</Button>
      </form>
    </Card>
  );
}
