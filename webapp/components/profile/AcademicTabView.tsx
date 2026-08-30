"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { gasCall } from "@/lib/gas-client";
import { courseStatusToTone } from "@/lib/status-colors";
import type { AcademicSummary, CourseEnrollment } from "@/lib/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus } from "lucide-react";

const GRADES = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F", "S", "U", "I", "W", ""];
const COURSE_TYPES = ["วิชาแกน", "วิชาบังคับเฉพาะสาขา", "วิชาเลือก", "วิทยานิพนธ์"];
const STATUSES = ["ลงทะเบียน", "กำลังศึกษา", "ผ่าน", "ถอน", "ไม่ผ่าน"];
const inputClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

export function AcademicTabView({
  studentId,
  initialCourses,
  academic,
  canEdit,
}: {
  studentId: string;
  initialCourses: CourseEnrollment[];
  academic: AcademicSummary;
  canEdit: boolean;
}) {
  const [courses, setCourses] = useState(initialCourses);
  const [modalOpen, setModalOpen] = useState(false);
  const form = useForm<Partial<CourseEnrollment>>({ defaultValues: { Semester: "1", CourseType: "วิชาบังคับเฉพาะสาขา", Status: "ลงทะเบียน" } });

  async function onSubmit(data: Partial<CourseEnrollment>) {
    const enrollmentId = await gasCall<string>("upsertCourseEnrollment", { studentId, data });
    setCourses((prev) => [...prev, { ...data, EnrollmentId: enrollmentId } as CourseEnrollment]);
    setModalOpen(false);
    form.reset();
  }

  const chartData = academic.gpaTrend.map((t) => ({
    label: `${t.semester === "summer" ? "ฤดูร้อน" : "เทอม " + t.semester}/${t.academicYear}`,
    gpa: t.gpa,
  }));

  return (
    <div className="space-y-4">
      <Card
        title="รายวิชาที่ลงทะเบียน"
        action={canEdit ? (
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> เพิ่มรายวิชา
          </Button>
        ) : undefined}
      >
        <Table>
          <Thead>
            <Th>รหัสวิชา</Th>
            <Th>รายวิชา</Th>
            <Th>ประเภท</Th>
            <Th>หน่วยกิต</Th>
            <Th>เกรด</Th>
            <Th>สถานะ</Th>
          </Thead>
          <tbody>
            {courses.map((c) => (
              <Tr key={c.EnrollmentId}>
                <Td className="font-mono text-xs">{c.CourseCode}</Td>
                <Td>{c.CourseNameTH}</Td>
                <Td className="text-xs">{c.CourseType}</Td>
                <Td>{c.Credits}</Td>
                <Td>{c.Grade || "-"}</Td>
                <Td><Badge tone={courseStatusToTone(c.Status)}>{c.Status}</Badge></Td>
              </Tr>
            ))}
            {courses.length === 0 && <Tr><Td className="text-center text-foreground/40 py-8">ยังไม่มีรายวิชา</Td></Tr>}
          </tbody>
        </Table>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={`แนวโน้ม GPAX (${chartData.length} ภาคการศึกษา)`}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="gpa" stroke="#8B1A2B" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="ความก้าวหน้าหน่วยกิต">
          <div className="flex flex-col items-center justify-center h-full py-4">
            <p className="text-3xl font-bold">{academic.creditsPassed}/{academic.creditsRequired}</p>
            <p className="text-sm text-foreground/50 mb-4">หน่วยกิต</p>
            <ProgressBar percent={(academic.creditsPassed / academic.creditsRequired) * 100} tone="yellow" className="w-full" />
          </div>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="เพิ่มรายวิชา">
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
          <label className="col-span-1 text-sm">ปีการศึกษา
            <input className={inputClass} {...form.register("AcademicYear", { required: true })} />
          </label>
          <label className="col-span-1 text-sm">ภาคเรียน
            <select className={inputClass} {...form.register("Semester")}>
              <option value="1">1</option><option value="2">2</option><option value="summer">ฤดูร้อน</option>
            </select>
          </label>
          <label className="col-span-1 text-sm">รหัสวิชา
            <input className={inputClass} {...form.register("CourseCode", { required: true })} />
          </label>
          <label className="col-span-1 text-sm">หน่วยกิต
            <input type="number" className={inputClass} {...form.register("Credits", { valueAsNumber: true, required: true })} />
          </label>
          <label className="col-span-2 text-sm">ชื่อวิชา (TH)
            <input className={inputClass} {...form.register("CourseNameTH", { required: true })} />
          </label>
          <label className="col-span-2 text-sm">ชื่อวิชา (EN)
            <input className={inputClass} {...form.register("CourseNameEN")} />
          </label>
          <label className="col-span-1 text-sm">ประเภทวิชา
            <select className={inputClass} {...form.register("CourseType")}>
              {COURSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="col-span-1 text-sm">สถานะ
            <select className={inputClass} {...form.register("Status")}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="col-span-1 text-sm">เกรด
            <select className={inputClass} {...form.register("Grade")}>
              {GRADES.map((g) => <option key={g} value={g}>{g || "-"}</option>)}
            </select>
          </label>
          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>ยกเลิก</Button>
            <Button type="submit">บันทึก</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
