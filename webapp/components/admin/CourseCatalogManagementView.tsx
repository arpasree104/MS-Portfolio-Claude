"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { gasCall } from "@/lib/gas-client";
import type { CourseCatalogItem, CourseType } from "@/lib/types";
import { Plus, Power } from "lucide-react";

const COURSE_TYPES: CourseType[] = ["วิชาแกน", "วิชาบังคับเฉพาะสาขา", "วิชาเลือก", "วิทยานิพนธ์"];
const inputClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

interface FormValues {
  CourseCode: string;
  CourseNameTH: string;
  CourseNameEN: string;
  CourseType: CourseType;
  Credits: number;
}

export function CourseCatalogManagementView({ initialCourses }: { initialCourses: CourseCatalogItem[] }) {
  const [courses, setCourses] = useState(initialCourses);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const form = useForm<FormValues>({ defaultValues: { CourseType: "วิชาเลือก", Credits: 3 } });

  async function onSubmit(data: FormValues) {
    setErrorMsg(null);
    try {
      const created = await gasCall<CourseCatalogItem>("createCourseCatalogItem", { data });
      setCourses((prev) => [...prev, created]);
      setModalOpen(false);
      form.reset({ CourseType: "วิชาเลือก", Credits: 3, CourseCode: "", CourseNameTH: "", CourseNameEN: "" });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  async function toggleActive(course: CourseCatalogItem) {
    const nextStatus = course.IsActive === "TRUE" ? "FALSE" : "TRUE";
    await gasCall("updateCourseCatalogItem", { courseCode: course.CourseCode, patch: { IsActive: nextStatus } });
    setCourses((prev) =>
      prev.map((c) => (c.CourseCode === course.CourseCode ? { ...c, IsActive: nextStatus } : c))
    );
  }

  return (
    <Card
      title={`รายวิชาทั้งหมด (${courses.length})`}
      action={<Button variant="secondary" onClick={() => setModalOpen(true)}><Plus size={16} /> เพิ่มรายวิชา</Button>}
    >
      <Table>
        <Thead>
          <Th>รหัสวิชา</Th>
          <Th>ชื่อวิชา (ไทย)</Th>
          <Th>ชื่อวิชา (อังกฤษ)</Th>
          <Th>ประเภท</Th>
          <Th>หน่วยกิต</Th>
          <Th>สถานะ</Th>
          <Th>{" "}</Th>
        </Thead>
        <tbody>
          {courses.map((c) => (
            <Tr key={c.CourseCode}>
              <Td className="font-mono text-xs">{c.CourseCode}</Td>
              <Td>{c.CourseNameTH}</Td>
              <Td className="text-xs text-foreground/60">{c.CourseNameEN || "-"}</Td>
              <Td className="text-xs">{c.CourseType}</Td>
              <Td>{c.Credits}</Td>
              <Td><Badge tone={c.IsActive === "TRUE" ? "green" : "gray"}>{c.IsActive === "TRUE" ? "เปิดใช้งาน" : "ปิดใช้งาน"}</Badge></Td>
              <Td>
                <Button variant="secondary" onClick={() => toggleActive(c)}>
                  <Power size={14} /> {c.IsActive === "TRUE" ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                </Button>
              </Td>
            </Tr>
          ))}
          {courses.length === 0 && (
            <Tr><Td className="text-center text-foreground/40 py-8">ยังไม่มีรายวิชาในระบบ</Td></Tr>
          )}
        </tbody>
      </Table>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="เพิ่มรายวิชา">
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
          <label className="col-span-1 text-sm">รหัสวิชา
            <input className={inputClass} {...form.register("CourseCode", { required: true })} />
          </label>
          <label className="col-span-1 text-sm">หน่วยกิต
            <input type="number" className={inputClass} {...form.register("Credits", { valueAsNumber: true, required: true })} />
          </label>
          <label className="col-span-2 text-sm">ชื่อวิชา (ไทย)
            <input className={inputClass} {...form.register("CourseNameTH", { required: true })} />
          </label>
          <label className="col-span-2 text-sm">ชื่อวิชา (อังกฤษ)
            <input className={inputClass} {...form.register("CourseNameEN")} />
          </label>
          <label className="col-span-2 text-sm">ประเภทวิชา
            <select className={inputClass} {...form.register("CourseType")}>
              {COURSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          {errorMsg && <p className="col-span-2 text-sm text-status-red">{errorMsg}</p>}
          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={form.formState.isSubmitting}>ยกเลิก</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "กำลังบันทึก..." : "บันทึก"}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
