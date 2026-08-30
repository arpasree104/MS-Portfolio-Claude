"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BlockingOverlay } from "@/components/ui/BlockingOverlay";
import { gasCall } from "@/lib/gas-client";
import { Sparkles, Trash2, AlertTriangle } from "lucide-react";

interface SeedResult { message: string; studentsCreated?: number; advisorsCreated?: number }
interface ClearResult { message: string; totalDeleted: number; bySheet: Record<string, number> }

export function SeedDataView() {
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSeed() {
    setSeeding(true);
    setErrorMsg(null);
    setResultMsg(null);
    try {
      const result = await gasCall<SeedResult>("seedDemoData", {});
      setResultMsg(result.message);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSeeding(false);
    }
  }

  async function handleClear() {
    const confirmed = window.confirm(
      "ยืนยันการล้างข้อมูลตัวอย่างทั้งหมด?\n\nระบบจะลบเฉพาะรายการที่มีรหัสขึ้นต้นด้วย \"SEED-\" เท่านั้น ข้อมูลจริงของผู้ใช้งานจะไม่ถูกกระทบ"
    );
    if (!confirmed) return;

    setClearing(true);
    setErrorMsg(null);
    setResultMsg(null);
    try {
      const result = await gasCall<ClearResult>("clearSeedData", {});
      setResultMsg(result.message);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="space-y-4">
      <BlockingOverlay open={seeding} message="กำลังสร้างข้อมูลตัวอย่าง..." />
      <BlockingOverlay open={clearing} message="กำลังล้างข้อมูลตัวอย่าง..." />

      <Card title="ข้อมูลตัวอย่าง (สำหรับทดลอง/สาธิตระบบ)">
        <p className="text-sm text-foreground/60 mb-4">
          สร้างข้อมูลตัวอย่างครบชุด (สาขาวิชา, อาจารย์ 2 คน — 1 คนเป็นหัวหน้าสาขา, นักศึกษา 5 คน
          พร้อมประวัติ ผลการเรียน วิทยานิพนธ์ในขั้นตอนต่างกัน บันทึกการปรึกษา นัดหมาย และผลงาน)
          เพื่อใช้ทดลองคลิกดูระบบก่อนเริ่มใช้งานจริง
        </p>

        {resultMsg && (
          <div className="rounded-lg bg-status-green/10 text-status-green text-sm px-4 py-2 mb-4">{resultMsg}</div>
        )}
        {errorMsg && (
          <div className="rounded-lg bg-status-red/10 text-status-red text-sm px-4 py-2 mb-4">{errorMsg}</div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSeed} disabled={seeding || clearing}>
            <Sparkles size={16} /> {seeding ? "กำลังสร้างข้อมูล..." : "สร้างข้อมูลตัวอย่าง"}
          </Button>
          <Button variant="danger" onClick={handleClear} disabled={seeding || clearing}>
            <Trash2 size={16} /> {clearing ? "กำลังล้างข้อมูล..." : "ล้างข้อมูลตัวอย่างทั้งหมด"}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-2 text-sm text-foreground/60">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-status-yellow-text" />
          <p>
            ปุ่ม &quot;ล้างข้อมูลตัวอย่างทั้งหมด&quot; ปลอดภัยจากการกดผิดหลังใช้งานจริงแล้ว —
            ระบบตรวจสอบและลบเฉพาะรายการที่มีรหัสขึ้นต้นด้วย <code className="px-1 py-0.5 rounded bg-black/5">SEED-</code> เท่านั้น
            ซึ่งเป็นรูปแบบที่ไม่มีทางเกิดขึ้นจากการกรอกข้อมูลจริงของนักศึกษาหรืออาจารย์ในระบบ
          </p>
        </div>
      </Card>
    </div>
  );
}
