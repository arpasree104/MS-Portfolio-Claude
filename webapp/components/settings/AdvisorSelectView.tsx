"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { gasCall } from "@/lib/gas-client";
import type { Student } from "@/lib/types";

interface AdvisorOption { userId: string; displayNameTH: string; displayNameEN: string; email: string }

export function AdvisorSelectView({
  studentId,
  student,
  advisors,
}: {
  studentId: string;
  student: Student;
  advisors: AdvisorOption[];
}) {
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const form = useForm({
    defaultValues: {
      academicAdvisorId: student.AcademicAdvisorId || "",
      majorAdvisorId: student.MajorAdvisorId || "",
      coAdvisorId: student.CoAdvisorId || "",
    },
  });

  async function onSubmit(data: { academicAdvisorId: string; majorAdvisorId: string; coAdvisorId: string }) {
    await gasCall("setStudentAdvisors", { studentId, advisorIds: data });
    setSavedMsg("บันทึกอาจารย์ที่ปรึกษาแล้ว");
    setTimeout(() => setSavedMsg(null), 3000);
  }

  const selectClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm";

  return (
    <Card title="เลือกอาจารย์ที่ปรึกษา">
      {savedMsg && <div className="rounded-lg bg-status-green/10 text-status-green text-sm px-4 py-2 mb-4">{savedMsg}</div>}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <label className="block text-sm">อาจารย์ที่ปรึกษาทางวิชาการ
          <select className={selectClass} {...form.register("academicAdvisorId")}>
            <option value="">-- ไม่ระบุ --</option>
            {advisors.map((a) => <option key={a.userId} value={a.userId}>{a.displayNameTH || a.displayNameEN || a.email}</option>)}
          </select>
        </label>
        <label className="block text-sm">อาจารย์ที่ปรึกษาวิทยานิพนธ์หลัก
          <select className={selectClass} {...form.register("majorAdvisorId")}>
            <option value="">-- ไม่ระบุ --</option>
            {advisors.map((a) => <option key={a.userId} value={a.userId}>{a.displayNameTH || a.displayNameEN || a.email}</option>)}
          </select>
        </label>
        <label className="block text-sm">อาจารย์ที่ปรึกษาร่วม (Co-advisor)
          <select className={selectClass} {...form.register("coAdvisorId")}>
            <option value="">-- ไม่ระบุ --</option>
            {advisors.map((a) => <option key={a.userId} value={a.userId}>{a.displayNameTH || a.displayNameEN || a.email}</option>)}
          </select>
        </label>
        <Button type="submit">บันทึก</Button>
      </form>
    </Card>
  );
}
