"use client";
import { Printer } from "lucide-react";
import type {
  AcademicSummary, EducationHistory, PLOWithAssessment, PortfolioItem,
  ProfessionalHistory, Student, StudentGoals, ThesisDetail,
} from "@/lib/types";

interface Props {
  student: Student;
  education: EducationHistory | null;
  professional: ProfessionalHistory | null;
  goals: StudentGoals | null;
  academic: AcademicSummary;
  plos: PLOWithAssessment[];
  portfolio: PortfolioItem[];
  thesis: ThesisDetail | null;
}

export function PortfolioReport({ student, education, professional, goals, academic, plos, portfolio, thesis }: Props) {
  const today = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });

  const portfolioByCategory = portfolio.reduce<Record<string, PortfolioItem[]>>((acc, item) => {
    (acc[item.Category] ||= []).push(item);
    return acc;
  }, {});

  return (
    <div>
      <button
        onClick={() => window.print()}
        className="no-print fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-primary text-white px-5 py-3 text-sm font-medium shadow-card hover:bg-primary-dark"
      >
        <Printer size={18} /> พิมพ์รายงาน / บันทึกเป็น PDF
      </button>

      <div className="report-doc max-w-3xl mx-auto bg-surface md:card print:shadow-none print:border-0 print:p-0 space-y-6 text-sm">
        {/* Cover / header */}
        <section className="text-center border-b border-black/10 pb-4 break-inside-avoid">
          <p className="text-xs text-foreground/50">แฟ้มสะสมผลงานและระบบติดตามความก้าวหน้านักศึกษา</p>
          <p className="text-xs text-foreground/50 mb-3">คณะพยาบาลศาสตร์ มหาวิทยาลัยธรรมศาสตร์</p>
          {student.PhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={student.PhotoUrl} alt="" className="h-20 w-20 rounded-full object-cover mx-auto mb-3 bg-black/5" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-black/5 mx-auto mb-3" />
          )}
          <h1 className="text-lg font-bold">{student.PrefixTH}{student.FirstNameTH} {student.LastNameTH}</h1>
          <p className="text-xs text-foreground/60">{student.PrefixEN} {student.FirstNameEN} {student.LastNameEN}</p>
          <p className="text-xs text-foreground/60 mt-1">รหัสนักศึกษา {student.StudentCode} · รุ่น {student.Cohort} · สถานภาพ {student.EnrollmentStatus}</p>
          <p className="text-[10px] text-foreground/40 mt-2">พิมพ์เมื่อ {today}</p>
        </section>

        <ReportSection title="ข้อมูลส่วนตัว">
          <ReportGrid>
            <Field label="วันเกิด" value={student.BirthDate} />
            <Field label="โทรศัพท์" value={student.Phone} />
            <Field label="อีเมลมหาวิทยาลัย" value={student.UniversityEmail} />
            <Field label="อีเมลสำรอง" value={student.SecondaryEmail} />
            <Field label="ที่อยู่ปัจจุบัน" value={student.Address} full />
            <Field label="ผู้ติดต่อฉุกเฉิน" value={student.EmergencyContact} full />
          </ReportGrid>
        </ReportSection>

        {education && (
          <ReportSection title="ประวัติการศึกษา">
            <ReportGrid>
              <Field label="วุฒิปริญญาตรี" value={education.BachelorDegree} />
              <Field label="สถาบัน" value={education.Institution} />
              <Field label="ปีที่จบ" value={education.GraduationYear} />
              <Field label="GPA ปริญญาตรี" value={education.BachelorGPA} />
              <Field label="ผลสอบภาษาอังกฤษก่อนเข้าศึกษา" value={education.PreAdmissionEnglishScore} full />
            </ReportGrid>
          </ReportSection>
        )}

        {professional && (
          <ReportSection title="ประวัติวิชาชีพ">
            <ReportGrid>
              <Field label="เลขที่ใบอนุญาต" value={professional.LicenseNumber} />
              <Field label="วันหมดอายุ" value={professional.LicenseExpiry} />
              <Field label="สถานที่ปฏิบัติงาน" value={professional.Workplace} />
              <Field label="ตำแหน่ง/หน่วยงาน" value={professional.PositionDept} />
              <Field label="ความเชี่ยวชาญ" value={professional.Specialization} />
              <Field label="ประวัติการอบรม" value={professional.TrainingHistory} />
            </ReportGrid>
          </ReportSection>
        )}

        {goals && (
          <ReportSection title="เป้าหมายของนักศึกษา">
            <ReportGrid>
              <Field label="เป้าหมายทางวิชาการ" value={goals.AcademicGoals} full />
              <Field label="เป้าหมายทางวิชาชีพ" value={goals.ProfessionalGoals} full />
              <Field label="ประเด็นที่สนใจทำวิทยานิพนธ์" value={goals.ThesisInterest} full />
            </ReportGrid>
          </ReportSection>
        )}

        <ReportSection title="สรุปผลการเรียน">
          <ReportGrid>
            <Field label="หน่วยกิตที่ผ่าน" value={`${academic.creditsPassed} / ${academic.creditsRequired}`} />
            <Field label="GPAX" value={academic.gpax ?? "-"} />
            <Field label="GPA ภาคล่าสุด" value={academic.latestSemesterGpa ?? "-"} />
            <Field label="หน่วยกิตคงเหลือ" value={String(academic.creditsRemaining)} />
          </ReportGrid>
        </ReportSection>

        <ReportSection title="ผลลัพธ์การเรียนรู้ของหลักสูตร (PLO)">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-black/20 text-left">
                <th className="py-1.5 pr-2">PLO</th>
                <th className="py-1.5 pr-2">ระดับสมรรถนะ</th>
                <th className="py-1.5">คำอธิบายหลักฐาน</th>
              </tr>
            </thead>
            <tbody>
              {plos.map((p) => (
                <tr key={p.plo} className="border-b border-black/5">
                  <td className="py-1.5 pr-2 align-top font-medium">{p.plo}</td>
                  <td className="py-1.5 pr-2 align-top">{p.assessment?.CompetencyLevel || "-"}</td>
                  <td className="py-1.5 align-top text-foreground/70">{p.assessment?.EvidenceDescription || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportSection>

        <ReportSection title={`แฟ้มผลงาน (${portfolio.length} รายการ)`}>
          {Object.keys(portfolioByCategory).length === 0 && <p className="text-foreground/50 text-xs">ยังไม่มีผลงาน</p>}
          {Object.entries(portfolioByCategory).map(([category, items]) => (
            <div key={category} className="mb-3 break-inside-avoid">
              <p className="font-medium text-xs mb-1">{category}</p>
              <ul className="list-disc list-inside text-xs text-foreground/70 space-y-0.5">
                {items.map((item) => (
                  <li key={item.ItemId}>{item.Title} {item.ItemDate && `(${item.ItemDate})`}</li>
                ))}
              </ul>
            </div>
          ))}
        </ReportSection>

        {thesis && (
          <ReportSection title="ความก้าวหน้าวิทยานิพนธ์">
            <p className="text-xs mb-2"><span className="font-medium">ชื่อเรื่อง:</span> {thesis.thesis.TitleTH}</p>
            <p className="text-xs mb-3">ขั้นตอนปัจจุบัน: {thesis.thesis.CurrentStep}/8 ({thesis.thesis.OverallProgressPercent}%) — {thesis.thesis.OnTrackStatus}</p>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-black/20 text-left">
                  <th className="py-1.5 pr-2">ขั้นตอน</th>
                  <th className="py-1.5 pr-2">สถานะ</th>
                  <th className="py-1.5">วันที่ดำเนินการจริง</th>
                </tr>
              </thead>
              <tbody>
                {thesis.steps.map((s) => (
                  <tr key={s.step} className="border-b border-black/5">
                    <td className="py-1.5 pr-2">{s.step}. {s.nameTH}</td>
                    <td className="py-1.5 pr-2">{s.status}</td>
                    <td className="py-1.5">{s.actualDate || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ReportSection>
        )}
      </div>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="text-sm font-bold text-primary border-b-2 border-primary/30 pb-1 mb-2">{title}</h2>
      {children}
    </section>
  );
}

function ReportGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-2">{children}</div>;
}

function Field({ label, value, full }: { label: string; value?: string | number; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : undefined}>
      <p className="text-[10px] text-foreground/50">{label}</p>
      <p className="text-xs">{value || "-"}</p>
    </div>
  );
}
