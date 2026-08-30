"use client";
import { Users, CheckCircle2, AlertTriangle, AlertOctagon, GraduationCap } from "lucide-react";
import { StatCard, Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { riskLevelToTone, severityToTone } from "@/lib/status-colors";
import type { AdvisorDashboard } from "@/lib/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Link from "next/link";

const RISK_COLORS: Record<string, string> = {
  green: "#22A55A",
  yellow: "#F5A623",
  red: "#E53E3E",
  gray: "#9AA1AC",
  graduated: "#3B82F6",
};

export function AdvisorDashboardView({ data }: { data: AdvisorDashboard }) {
  const { summary, students, cohortComparison, alerts } = data;

  const pieData = [
    { name: "เป็นไปตามแผน", value: summary.onTrack, color: RISK_COLORS.green },
    { name: "ต้องติดตาม", value: summary.needsFollowUp, color: RISK_COLORS.yellow },
    { name: "เสี่ยงสูง", value: summary.atRisk, color: RISK_COLORS.red },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={<Users size={22} />} label="นักศึกษาทั้งหมด" value={summary.total} tone="primary" />
        <StatCard icon={<CheckCircle2 size={22} />} label="เป็นไปตามแผน" value={summary.onTrack} tone="green"
          sublabel={summary.total ? `${((summary.onTrack / summary.total) * 100).toFixed(1)}%` : "-"} />
        <StatCard icon={<AlertTriangle size={22} />} label="ต้องติดตาม" value={summary.needsFollowUp} tone="yellow"
          sublabel={summary.total ? `${((summary.needsFollowUp / summary.total) * 100).toFixed(1)}%` : "-"} />
        <StatCard icon={<AlertOctagon size={22} />} label="เสี่ยงสูง" value={summary.atRisk} tone="red"
          sublabel={summary.total ? `${((summary.atRisk / summary.total) * 100).toFixed(1)}%` : "-"} />
        <StatCard icon={<GraduationCap size={22} />} label="สำเร็จการศึกษา" value={summary.graduated} tone="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="เปรียบเทียบรายรุ่น" className="lg:col-span-2">
          <Table>
            <Thead>
              <Th>รุ่น</Th>
              <Th>นักศึกษาทั้งหมด</Th>
              <Th>เป็นไปตามแผน</Th>
              <Th>ต้องติดตาม</Th>
              <Th>เสี่ยงสูง</Th>
              <Th>GPAX เฉลี่ย</Th>
              <Th>หน่วยกิตเฉลี่ย</Th>
            </Thead>
            <tbody>
              {cohortComparison.map((c) => (
                <Tr key={c.cohort}>
                  <Td className="font-medium">รุ่น {c.cohort}</Td>
                  <Td>{c.total}</Td>
                  <Td>{c.onTrack} ({c.total ? ((c.onTrack / c.total) * 100).toFixed(0) : 0}%)</Td>
                  <Td>{c.needsFollowUp} ({c.total ? ((c.needsFollowUp / c.total) * 100).toFixed(0) : 0}%)</Td>
                  <Td>{c.atRisk} ({c.total ? ((c.atRisk / c.total) * 100).toFixed(0) : 0}%)</Td>
                  <Td>{c.averageGpax ?? "-"}</Td>
                  <Td>{c.averageCredits ?? "-"}</Td>
                </Tr>
              ))}
              {cohortComparison.length === 0 && (
                <Tr><Td className="text-foreground/40 py-8 text-center" >ยังไม่มีข้อมูลนักศึกษา</Td></Tr>
              )}
            </tbody>
          </Table>
        </Card>

        <Card title="สถานะความก้าวหน้า">
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-bold">{summary.total}</p>
              <p className="text-xs text-foreground/50">คน</p>
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-foreground/70">{d.name}</span>
                <span className="ml-auto font-medium">{d.value} คน</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="รายชื่อนักศึกษา" action={<Link href="/students" className="text-sm text-primary hover:underline">ดูทั้งหมด →</Link>}>
          <Table>
            <Thead>
              <Th>รหัส</Th>
              <Th>ชื่อ-สกุล</Th>
              <Th>รุ่น</Th>
              <Th>GPAX</Th>
              <Th>วิทยานิพนธ์</Th>
              <Th>สถานะ</Th>
            </Thead>
            <tbody>
              {students.slice(0, 8).map((s) => (
                <Tr key={s.studentId}>
                  <Td className="font-mono text-xs">{s.studentCode}</Td>
                  <Td>
                    <Link href={`/students/${s.studentId}/profile`} className="hover:text-primary hover:underline">
                      {s.name}
                    </Link>
                  </Td>
                  <Td>{s.cohort}</Td>
                  <Td>{s.gpax ?? "-"}</Td>
                  <Td>
                    {s.thesisStep ? (
                      <div className="w-24">
                        <ProgressBar percent={s.thesisProgressPercent} tone="primary" />
                        <span className="text-xs text-foreground/50">ขั้น {s.thesisStep}/8</span>
                      </div>
                    ) : "-"}
                  </Td>
                  <Td><Badge tone={riskLevelToTone(s.riskLevel)}>{riskLabelTH(s.riskLevel)}</Badge></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card title="รายการที่ต้องติดตาม" action={<span className="text-xs text-foreground/50">{alerts.length} รายการ</span>}>
          <div className="space-y-2">
            {alerts.length === 0 && <p className="text-sm text-foreground/40 py-8 text-center">ไม่มีรายการแจ้งเตือน</p>}
            {alerts.map((a) => (
              <div key={a.NotificationId} className="flex items-start gap-3 p-3 rounded-lg border border-black/5">
                <Badge tone={severityToTone(a.Severity)}>{a.Severity}</Badge>
                <p className="text-sm text-foreground/80 flex-1">{a.Message}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function riskLabelTH(risk: string) {
  switch (risk) {
    case "green": return "เป็นไปตามแผน";
    case "yellow": return "ต้องติดตาม";
    case "red": return "เสี่ยงสูง";
    case "graduated": return "สำเร็จการศึกษา";
    default: return "ยังไม่ถึงช่วง";
  }
}
