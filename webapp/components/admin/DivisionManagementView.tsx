"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { gasCall } from "@/lib/gas-client";
import type { Division } from "@/lib/types";
import { Plus, Power } from "lucide-react";

const inputClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

interface FormValues {
  NameTH: string;
  NameEN: string;
}

export function DivisionManagementView({ initialDivisions }: { initialDivisions: Division[] }) {
  const [divisions, setDivisions] = useState(initialDivisions);
  const [modalOpen, setModalOpen] = useState(false);
  const form = useForm<FormValues>();

  async function onSubmit(data: FormValues) {
    const created = await gasCall<Division>("createDivision", { data });
    setDivisions((prev) => [...prev, created]);
    setModalOpen(false);
    form.reset();
  }

  async function toggleActive(division: Division) {
    const nextStatus = division.IsActive === "TRUE" ? "FALSE" : "TRUE";
    await gasCall("updateDivision", { divisionId: division.DivisionId, patch: { IsActive: nextStatus } });
    setDivisions((prev) =>
      prev.map((d) => (d.DivisionId === division.DivisionId ? { ...d, IsActive: nextStatus } : d))
    );
  }

  return (
    <Card
      title={`สาขาวิชาทั้งหมด (${divisions.length})`}
      action={<Button variant="secondary" onClick={() => setModalOpen(true)}><Plus size={16} /> เพิ่มสาขาวิชา</Button>}
    >
      <Table>
        <Thead>
          <Th>ชื่อสาขา (ไทย)</Th>
          <Th>ชื่อสาขา (อังกฤษ)</Th>
          <Th>สถานะ</Th>
          <Th>{" "}</Th>
        </Thead>
        <tbody>
          {divisions.map((d) => (
            <Tr key={d.DivisionId}>
              <Td>{d.NameTH}</Td>
              <Td className="text-xs text-foreground/60">{d.NameEN || "-"}</Td>
              <Td><Badge tone={d.IsActive === "TRUE" ? "green" : "gray"}>{d.IsActive === "TRUE" ? "เปิดใช้งาน" : "ปิดใช้งาน"}</Badge></Td>
              <Td>
                <Button variant="secondary" onClick={() => toggleActive(d)}>
                  <Power size={14} /> {d.IsActive === "TRUE" ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                </Button>
              </Td>
            </Tr>
          ))}
          {divisions.length === 0 && (
            <Tr><Td className="text-center text-foreground/40 py-8">ยังไม่มีสาขาวิชาในระบบ</Td></Tr>
          )}
        </tbody>
      </Table>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="เพิ่มสาขาวิชา">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <label className="block text-sm">ชื่อสาขาวิชา (ไทย)
            <input className={inputClass} {...form.register("NameTH", { required: true })} />
          </label>
          <label className="block text-sm">ชื่อสาขาวิชา (อังกฤษ)
            <input className={inputClass} {...form.register("NameEN")} />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={form.formState.isSubmitting}>ยกเลิก</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
