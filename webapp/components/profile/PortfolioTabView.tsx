"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";
import { gasCall } from "@/lib/gas-client";
import type { PortfolioCategory, PortfolioItem } from "@/lib/types";
import { Plus, ExternalLink } from "lucide-react";

const CATEGORIES: PortfolioCategory[] = [
  "ผลงานรายวิชา", "รายงานกรณีศึกษา", "ผลงานการปฏิบัติการพยาบาลขั้นสูง",
  "โครงการพัฒนาคุณภาพ", "นวัตกรรมทางการพยาบาล", "การนำเสนอในชั้นเรียน",
  "การประชุมวิชาการ", "บทความหรือผลงานตีพิมพ์", "รางวัลและเกียรติบัตร",
  "กิจกรรมบริการวิชาการ", "กิจกรรมภาวะผู้นำและจิตอาสา", "การอบรมและการพัฒนาวิชาชีพ",
];

const inputClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

interface FormValues {
  Category: PortfolioCategory;
  Title: string;
  ItemDate: string;
  StudentRole: string;
  RelatedPLOs: string;
  Outcome: string;
}

export function PortfolioTabView({
  studentId,
  initialItems,
  canEdit,
}: {
  studentId: string;
  initialItems: PortfolioItem[];
  canEdit: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<string>("ทั้งหมด");
  const [pendingFile, setPendingFile] = useState<{ base64: string; name: string; mime: string } | null>(null);

  const form = useForm<FormValues>({ defaultValues: { Category: CATEGORIES[0] } });

  async function onSubmit(data: FormValues) {
    const payload: Record<string, unknown> = { ...data };
    if (pendingFile) {
      payload.fileBase64 = pendingFile.base64;
      payload.fileName = pendingFile.name;
      payload.fileMimeType = pendingFile.mime;
    }
    const itemId = await gasCall<string>("createPortfolioItem", { studentId, data: payload });
    setItems((prev) => [{ ...data, ItemId: itemId, FileUrl: "", CreatedAt: new Date().toISOString() } as PortfolioItem, ...prev]);
    setModalOpen(false);
    setPendingFile(null);
    form.reset();
  }

  const filtered = filter === "ทั้งหมด" ? items : items.filter((i) => i.Category === filter);

  return (
    <div className="space-y-4">
      <Card
        title={`แฟ้มผลงาน (${items.length} รายการ)`}
        action={canEdit ? (
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> เพิ่มผลงาน
          </Button>
        ) : undefined}
      >
        <div className="flex gap-2 flex-wrap mb-4">
          {["ทั้งหมด", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`text-xs px-3 py-1.5 rounded-full border ${filter === c ? "bg-primary text-white border-primary" : "border-black/10 text-foreground/60 hover:bg-black/5"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <Table>
          <Thead>
            <Th>ชื่อผลงาน</Th>
            <Th>ประเภท</Th>
            <Th>วันที่</Th>
            <Th>บทบาท</Th>
            <Th>ไฟล์</Th>
          </Thead>
          <tbody>
            {filtered.map((item) => (
              <Tr key={item.ItemId}>
                <Td>{item.Title}</Td>
                <Td className="text-xs">{item.Category}</Td>
                <Td className="text-xs">{item.ItemDate}</Td>
                <Td className="text-xs">{item.StudentRole}</Td>
                <Td>
                  {item.FileUrl ? (
                    <a href={item.FileUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs inline-flex items-center gap-1 hover:underline">
                      เปิดไฟล์ <ExternalLink size={12} />
                    </a>
                  ) : "-"}
                </Td>
              </Tr>
            ))}
            {filtered.length === 0 && <Tr><Td className="text-center text-foreground/40 py-8">ยังไม่มีผลงานในหมวดนี้</Td></Tr>}
          </tbody>
        </Table>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="เพิ่มผลงาน" wide>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
          <label className="col-span-2 text-sm">ประเภทผลงาน
            <select className={inputClass} {...form.register("Category")}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="col-span-2 text-sm">ชื่อผลงาน
            <input className={inputClass} {...form.register("Title", { required: true })} />
          </label>
          <label className="col-span-1 text-sm">วันที่
            <input type="date" className={inputClass} {...form.register("ItemDate")} />
          </label>
          <label className="col-span-1 text-sm">บทบาทของนักศึกษา
            <input className={inputClass} {...form.register("StudentRole")} />
          </label>
          <label className="col-span-1 text-sm">PLO ที่เกี่ยวข้อง
            <input className={inputClass} placeholder="เช่น PLO2, PLO4" {...form.register("RelatedPLOs")} />
          </label>
          <label className="col-span-1 text-sm">ผลลัพธ์
            <input className={inputClass} {...form.register("Outcome")} />
          </label>
          <div className="col-span-2">
            <span className="text-xs font-medium text-foreground/60 mb-1 block">ไฟล์หลักฐาน</span>
            <FileUpload onFileReady={(base64, name, mime) => setPendingFile({ base64, name, mime })} />
          </div>
          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={form.formState.isSubmitting}>ยกเลิก</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "กำลังบันทึก..." : "บันทึก"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
