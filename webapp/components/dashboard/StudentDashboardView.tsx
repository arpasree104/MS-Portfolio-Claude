"use client";
import { BookOpen, TrendingUp, Globe, FolderOpen, GraduationCap } from "lucide-react";
import { StatCard, Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { severityToTone, onTrackStatusToTone } from "@/lib/status-colors";
import type { StudentDashboard } from "@/lib/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function StudentDashboardView({ data }: { data: StudentDashboard }) {
  const { profile, academic, thesis, portfolioCount, alerts } = data;

  const chartData = academic.gpaTrend.map((t) => ({
    label: `${t.semester === "summer" ? "ฤดูร้อน" : "เทอม " + t.semester}/${t.academicYear}`,
    gpa: t.gpa,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          {profile.PhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.PhotoUrl} alt="" className="h-16 w-16 rounded-full object-cover shrink-0 bg-black/5" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-black/5 shrink-0" />
          )}
          <div>
            <h2 className="font-bold text-lg">{profile.PrefixTH}{profile.FirstNameTH} {profile.LastNameTH}</h2>
            <div className="flex gap-4 text-sm text-foreground/60 mt-0.5">
              <span>รหัส {profile.StudentCode}</span>
              <span>รุ่น {profile.Cohort}</span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-status-green" /> {profile.EnrollmentStatus}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          icon={<BookOpen size={22} />}
          label="หน่วยกิต"
          value={`${academic.creditsPassed}/${academic.creditsRequired}`}
          sublabel={`${((academic.creditsPassed / academic.creditsRequired) * 100).toFixed(1)}%`}
          tone="yellow"
        />
        <StatCard icon={<TrendingUp size={22} />} label="GPAX" value={academic.gpax ?? "-"} tone="green" />
        <StatCard icon={<Globe size={22} />} label="ภาษาอังกฤษ" value="-" sublabel="ยังไม่มีข้อมูล" tone="yellow" />
        <StatCard icon={<FolderOpen size={22} />} label="ผลงาน" value={portfolioCount} sublabel="รายการ" tone="primary" />
        <StatCard
          icon={<GraduationCap size={22} />}
          label="วิทยานิพนธ์"
          value={thesis ? `ขั้นที่ ${thesis.CurrentStep}` : "ยังไม่เริ่ม"}
          sublabel={thesis ? `${thesis.OverallProgressPercent}%` : undefined}
          tone="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title={`แนวโน้ม GPAX (${chartData.length} ภาคการศึกษา)`} className="lg:col-span-2" tone="green">
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

        <Card title="ความก้าวหน้าหน่วยกิต" tone="yellow">
          <div className="flex flex-col items-center justify-center h-full py-4">
            <p className="text-3xl font-bold">{academic.creditsPassed}/{academic.creditsRequired}</p>
            <p className="text-sm text-foreground/50 mb-4">หน่วยกิต</p>
            <ProgressBar percent={(academic.creditsPassed / academic.creditsRequired) * 100} tone="yellow" className="w-full" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {thesis && (
          <Card title="ความก้าวหน้าวิทยานิพนธ์" tone="blue">
            <div className="flex items-center justify-between mb-2">
              <Badge tone={onTrackStatusToTone(thesis.OnTrackStatus)}>{thesis.OnTrackStatus}</Badge>
              <span className="text-sm font-medium">{thesis.OverallProgressPercent}%</span>
            </div>
            <ProgressBar percent={thesis.OverallProgressPercent} tone="primary" />
            <p className="text-xs text-foreground/50 mt-2">ขั้นตอนปัจจุบัน: ขั้นที่ {thesis.CurrentStep} จาก 8</p>
          </Card>
        )}

        <Card title="สัญญาณเตือน" tone="red" action={<span className="text-xs text-foreground/50">{alerts.length} รายการ</span>}>
          <div className="space-y-2">
            {alerts.length === 0 && <p className="text-sm text-foreground/40 py-6 text-center">ไม่มีรายการแจ้งเตือน</p>}
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
