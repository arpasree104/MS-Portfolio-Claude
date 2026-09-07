"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { FileUpload } from "@/components/ui/FileUpload";
import { gasCall } from "@/lib/gas-client";
import type { AdvisingLog, AdvisingLogReply } from "@/lib/types";
import { Plus, CheckCircle2, MessageSquare, Paperclip, Send } from "lucide-react";

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

function isOverdue(log: AdvisingLog, hasSubmission: boolean) {
  if (!log.ActionItems || !log.DueDate || hasSubmission) return false;
  return new Date(log.DueDate).getTime() < new Date().setHours(0, 0, 0, 0);
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
  const [openThreadLogId, setOpenThreadLogId] = useState<string | null>(null);
  const [repliesByLog, setRepliesByLog] = useState<Record<string, AdvisingLogReply[]>>({});
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

  async function toggleThread(logId: string) {
    if (openThreadLogId === logId) {
      setOpenThreadLogId(null);
      return;
    }
    setOpenThreadLogId(logId);
    if (!repliesByLog[logId]) {
      const replies = await gasCall<AdvisingLogReply[]>("listAdvisingLogReplies", { studentId, logId });
      setRepliesByLog((prev) => ({ ...prev, [logId]: replies }));
    }
  }

  function addReplyLocal(logId: string, reply: AdvisingLogReply) {
    setRepliesByLog((prev) => ({ ...prev, [logId]: [...(prev[logId] || []), reply] }));
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
          {logs.map((log) => {
            const replies = repliesByLog[log.LogId] || [];
            const hasSubmission = replies.some((r) => r.IsSubmission === "TRUE");
            const overdue = isOverdue(log, hasSubmission);
            return (
              <div key={log.LogId} className="border border-black/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-foreground/50">
                    <span>{log.LogDate}</span>
                    <Badge tone="gray">{log.Format}</Badge>
                    <Badge tone="primary">{log.ConsultType}</Badge>
                    {overdue && <Badge tone="red">ส่งงานล่าช้า</Badge>}
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
                {log.ActionItems && (
                  <p className="text-sm">
                    <span className="text-foreground/50">งานที่ต้องดำเนินการ:</span> {log.ActionItems} {log.DueDate && `(กำหนด ${log.DueDate})`}
                  </p>
                )}

                <button
                  onClick={() => toggleThread(log.LogId)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <MessageSquare size={14} />
                  {openThreadLogId === log.LogId ? "ซ่อนการสนทนา" : `ดูการสนทนา${replies.length ? ` (${replies.length})` : ""}`}
                </button>

                {openThreadLogId === log.LogId && (
                  <LogReplyThread
                    studentId={studentId}
                    log={log}
                    replies={replies}
                    canReply={isStudent || isAdvisor}
                    onReplyAdded={(reply) => addReplyLocal(log.LogId, reply)}
                  />
                )}
              </div>
            );
          })}
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
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={form.formState.isSubmitting}>ยกเลิก</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "กำลังบันทึก..." : "บันทึก"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function LogReplyThread({
  studentId,
  log,
  replies,
  canReply,
  onReplyAdded,
}: {
  studentId: string;
  log: AdvisingLog;
  replies: AdvisingLogReply[];
  canReply: boolean;
  onReplyAdded: (reply: AdvisingLogReply) => void;
}) {
  const [message, setMessage] = useState("");
  const [isSubmission, setIsSubmission] = useState(false);
  const [fileData, setFileData] = useState<{ base64: string; name: string; mimeType: string } | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!message.trim() && !fileData) return;
    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        Message: message,
        IsSubmission: isSubmission ? "TRUE" : "FALSE",
      };
      if (fileData) {
        payload.fileBase64 = fileData.base64;
        payload.fileName = fileData.name;
        payload.fileMimeType = fileData.mimeType;
      }
      const reply = await gasCall<AdvisingLogReply>("createAdvisingLogReply", { studentId, logId: log.LogId, data: payload });
      onReplyAdded(reply);
      setMessage("");
      setIsSubmission(false);
      setFileData(null);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-black/5 space-y-3">
      {replies.map((r) => (
        <div key={r.ReplyId} className="flex gap-2 text-sm">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-medium shrink-0">
            {r.AuthorRole === "student" ? "นศ" : "อจ"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-black/[0.03] rounded-lg px-3 py-2">
              {r.IsSubmission === "TRUE" && <Badge tone="green" className="mb-1">ส่งงาน</Badge>}
              {r.Message && <p className="whitespace-pre-wrap">{r.Message}</p>}
              {r.FileUrl && (
                <a href={r.FileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary text-xs hover:underline mt-1">
                  <Paperclip size={12} /> ไฟล์แนบ
                </a>
              )}
            </div>
            <p className="text-[10px] text-foreground/40 mt-0.5">{new Date(r.CreatedAt).toLocaleString("th-TH")}</p>
          </div>
        </div>
      ))}
      {replies.length === 0 && <p className="text-xs text-foreground/40 text-center py-2">ยังไม่มีการสนทนาในบันทึกนี้</p>}

      {canReply && (
        <div className="space-y-2">
          <textarea
            className={inputClass}
            rows={2}
            placeholder="พิมพ์ข้อความ..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <FileUpload
              label={fileData ? fileData.name : "แนบไฟล์"}
              onFileReady={(base64, fileName, mimeType) => setFileData({ base64, name: fileName, mimeType })}
            />
            <label className="flex items-center gap-1.5 text-xs text-foreground/60">
              <input type="checkbox" checked={isSubmission} onChange={(e) => setIsSubmission(e.target.checked)} />
              นี่คือการส่งงานตามที่ได้รับมอบหมาย
            </label>
            <Button onClick={handleSend} disabled={sending || (!message.trim() && !fileData)} className="ml-auto">
              <Send size={14} /> {sending ? "กำลังส่ง..." : "ส่งข้อความ"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
