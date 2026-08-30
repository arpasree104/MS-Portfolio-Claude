"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { gasCall } from "@/lib/gas-client";
import type { AdvisingLog } from "@/lib/types";
import { Plus, CheckCircle2 } from "lucide-react";

const inputClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

interface FormValues {
  LogDate: string;
  Format: "On-site" | "Online" | "โทรศัพท์";
  ConsultType: "การเรียน" | "วิทยานิพนธ์" | "การเผยแพร่" | "ปัญหาส่วนบุคคล";
  Discussion: string;
  AdvisorSuggestion: string;
  ActionItems: string;
  DueDate: string;
  IsConfidential: string;
}

export function AdvisingTabView({
  studentId,
  initialLogs,
  isAdvisor,
  isStudent,
}: {
  studentId: string;
  initialLogs: AdvisingLog[];
  isAdvisor: boolean;
  isStudent: boolean;
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [modalOpen, setModalOpen] = useState(false);
  const form = useForm<FormValues>({
    defaultValues: { Format: "On-site", ConsultType: "การเรียน", IsConfidential: "FALSE" },
  });

  async function onSubmit(data: FormValues) {
    const logId = await gasCall<string>("createAdvisingLog", { studentId, data });
    setLogs((prev) => [{ ...data, LogId: logId, AckByAdvisor: "TRUE", AckByStudent: "FALSE", FileUrl: "", CreatedAt: new Date().toISOString(), StudentId: studentId, AdvisorId: "" } as AdvisingLog, ...prev]);
    setModalOpen(false);
    form.reset();
  }

  async function acknowledge(logId: string) {
    await gasCall("acknowledgeAdvisingLog", { studentId, logId });
    setLogs((prev) => prev.map((l) => (l.LogId === logId ? { ...l, AckByStudent: "TRUE" } : l)));
  }

  return (
    <div className="space-y-4">
      <Card
        title={`บันทึกการให้คำปรึกษา (${logs.length} รายการ)`}
        action={isAdvisor ? (
          <Button variant="secondary" onClick={() => setModalOpen(true)}><Plus size={16} /> บันทึกใหม่</Button>
        ) : undefined}
      >
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.LogId} className="border border-black/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-foreground/50">
                  <span>{log.LogDate}</span>
                  <Badge tone="gray">{log.Format}</Badge>
                  <Badge tone="primary">{log.ConsultType}</Badge>
                </div>
                {isStudent && log.AckByStudent !== "TRUE" && (
                  <Button variant="secondary" onClick={() => acknowledge(log.LogId)}>
                    <CheckCircle2 size={14} /> รับทราบ
                  </Button>
                )}
                {log.AckByStudent === "TRUE" && <Badge tone="green">รับทราบแล้ว</Badge>}
              </div>
              <p className="text-sm mb-1"><span className="text-foreground/50">ประเด็นที่หารือ:</span> {log.Discussion}</p>
              {log.AdvisorSuggestion && <p className="text-sm mb-1"><span className="text-foreground/50">ข้อเสนอแนะ:</span> {log.AdvisorSuggestion}</p>}
              {log.ActionItems && <p className="text-sm"><span className="text-foreground/50">งานที่ต้องดำเนินการ:</span> {log.ActionItems} {log.DueDate && `(กำหนด ${log.DueDate})`}</p>}
            </div>
          ))}
          {logs.length === 0 && <p className="text-center text-foreground/40 py-8 text-sm">ยังไม่มีบันทึกการให้คำปรึกษา</p>}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="บันทึกการให้คำปรึกษาใหม่" wide>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
          <label className="col-span-1 text-sm">วันที่พบ
            <input type="date" className={inputClass} {...form.register("LogDate", { required: true })} />
          </label>
          <label className="col-span-1 text-sm">รูปแบบ
            <select className={inputClass} {...form.register("Format")}>
              <option value="On-site">On-site</option><option value="Online">Online</option><option value="โทรศัพท์">โทรศัพท์</option>
            </select>
          </label>
          <label className="col-span-2 text-sm">ประเภทการปรึกษา
            <select className={inputClass} {...form.register("ConsultType")}>
              <option value="การเรียน">การเรียน</option><option value="วิทยานิพนธ์">วิทยานิพนธ์</option>
              <option value="การเผยแพร่">การเผยแพร่</option><option value="ปัญหาส่วนบุคคล">ปัญหาส่วนบุคคล</option>
            </select>
          </label>
          <label className="col-span-2 text-sm">ประเด็นที่หารือ
            <textarea className={inputClass} rows={2} {...form.register("Discussion", { required: true })} />
          </label>
          <label className="col-span-2 text-sm">ข้อเสนอแนะของอาจารย์
            <textarea className={inputClass} rows={2} {...form.register("AdvisorSuggestion")} />
          </label>
          <label className="col-span-1 text-sm">งานที่นักศึกษาต้องดำเนินการ
            <input className={inputClass} {...form.register("ActionItems")} />
          </label>
          <label className="col-span-1 text-sm">กำหนดเสร็จ
            <input type="date" className={inputClass} {...form.register("DueDate")} />
          </label>
          <label className="col-span-2 text-sm flex items-center gap-2">
            <input type="checkbox" onChange={(e) => form.setValue("IsConfidential", e.target.checked ? "TRUE" : "FALSE")} />
            บันทึกลับ (เฉพาะอาจารย์เห็น ไม่แสดงต่อนักศึกษา)
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
