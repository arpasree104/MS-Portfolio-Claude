"use client";
import Link from "next/link";
import { BookOpen, TrendingUp, Globe, FolderOpen, GraduationCap, Printer } from "lucide-react";
import type { Student, AcademicSummary, ThesisProgress } from "@/lib/types";

export function ProfileHeader({
  student,
  academic,
  thesis,
  portfolioCount,
}: {
  student: Student;
  academic: AcademicSummary;
  thesis: ThesisProgress | null;
  portfolioCount: number;
}) {
  return (
    <div className="card">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-black/5 shrink-0" />
          <div>
            <h2 className="font-bold text-lg">{student.PrefixTH}{student.FirstNameTH} {student.LastNameTH}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-foreground/60 mt-0.5">
              <span>รหัส {student.StudentCode}</span>
              <span>รุ่น {student.Cohort}</span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-status-green" /> {student.EnrollmentStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-wrap gap-3 justify-end items-center">
          <MiniStat icon={<BookOpen size={16} />} label="หน่วยกิต" value={`${academic.creditsPassed}/${academic.creditsRequired}`} />
          <MiniStat icon={<TrendingUp size={16} />} label="GPAX" value={academic.gpax ?? "-"} />
          <MiniStat icon={<Globe size={16} />} label="ภาษาอังกฤษ" value="-" />
          <MiniStat icon={<FolderOpen size={16} />} label="ผลงาน" value={`${portfolioCount} รายการ`} />
          <MiniStat icon={<GraduationCap size={16} />} label="วิทยานิพนธ์" value={thesis ? `ขั้นที่ ${thesis.CurrentStep}` : "ยังไม่เริ่ม"} />
          <Link
            href={`/students/${student.StudentId}/report`}
            className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-black/5"
          >
            <Printer size={16} /> พิมพ์รายงาน
          </Link>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-black/[0.03] px-3 py-2">
      <span className="text-primary">{icon}</span>
      <div className="leading-tight">
        <p className="text-[11px] text-foreground/50">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
