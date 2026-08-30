"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { gasCall } from "@/lib/gas-client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { EducationHistory, ProfessionalHistory, Student, StudentGoals } from "@/lib/types";

interface Props {
  studentId: string;
  student: Student;
  education: EducationHistory | null;
  professional: ProfessionalHistory | null;
  goals: StudentGoals | null;
  canEdit: boolean;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground/60 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-black/[0.03] disabled:text-foreground/60";

export function StudentInfoForm({ studentId, student, education, professional, goals, canEdit }: Props) {
  const [saving, setSaving] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const personalForm = useForm({ defaultValues: student });
  const eduForm = useForm({ defaultValues: education || ({} as EducationHistory) });
  const profForm = useForm({ defaultValues: professional || ({} as ProfessionalHistory) });
  const goalsForm = useForm({ defaultValues: goals || ({} as StudentGoals) });

  async function savePersonal(data: Partial<Student>) {
    setSaving("personal");
    try {
      await gasCall("updateStudentProfile", { studentId, patch: data });
      flash("บันทึกข้อมูลส่วนบุคคลแล้ว");
    } finally { setSaving(null); }
  }

  async function saveEducation(data: Partial<EducationHistory>) {
    setSaving("education");
    try {
      await gasCall("upsertEducationHistory", { studentId, data });
      flash("บันทึกประวัติการศึกษาแล้ว");
    } finally { setSaving(null); }
  }

  async function saveProfessional(data: Partial<ProfessionalHistory>) {
    setSaving("professional");
    try {
      await gasCall("upsertProfessionalHistory", { studentId, data });
      flash("บันทึกประวัติวิชาชีพแล้ว");
    } finally { setSaving(null); }
  }

  async function saveGoals(data: Partial<StudentGoals>) {
    setSaving("goals");
    try {
      await gasCall("upsertStudentGoals", { studentId, data });
      flash("บันทึกเป้าหมายแล้ว");
    } finally { setSaving(null); }
  }

  function flash(msg: string) {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(null), 3000);
  }

  return (
    <div className="space-y-4">
      {savedMsg && (
        <div className="rounded-lg bg-status-green/10 text-status-green text-sm px-4 py-2">{savedMsg}</div>
      )}

      <Card title="ข้อมูลส่วนบุคคล">
        <form onSubmit={personalForm.handleSubmit(savePersonal)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="คำนำหน้า (TH)"><input className={inputClass} disabled={!canEdit} {...personalForm.register("PrefixTH")} /></Field>
          <Field label="ชื่อ (TH)"><input className={inputClass} disabled={!canEdit} {...personalForm.register("FirstNameTH")} /></Field>
          <Field label="นามสกุล (TH)"><input className={inputClass} disabled={!canEdit} {...personalForm.register("LastNameTH")} /></Field>
          <Field label="First Name (EN)"><input className={inputClass} disabled={!canEdit} {...personalForm.register("FirstNameEN")} /></Field>
          <Field label="Last Name (EN)"><input className={inputClass} disabled={!canEdit} {...personalForm.register("LastNameEN")} /></Field>
          <Field label="วันเกิด"><input type="date" className={inputClass} disabled={!canEdit} {...personalForm.register("BirthDate")} /></Field>
          <Field label="ที่อยู่ปัจจุบัน"><input className={inputClass} disabled={!canEdit} {...personalForm.register("Address")} /></Field>
          <Field label="โทรศัพท์"><input className={inputClass} disabled={!canEdit} {...personalForm.register("Phone")} /></Field>
          <Field label="อีเมลมหาวิทยาลัย"><input className={inputClass} disabled={!canEdit} {...personalForm.register("UniversityEmail")} /></Field>
          <Field label="อีเมลสำรอง"><input className={inputClass} disabled={!canEdit} {...personalForm.register("SecondaryEmail")} /></Field>
          <Field label="ผู้ติดต่อฉุกเฉิน"><input className={inputClass} disabled={!canEdit} {...personalForm.register("EmergencyContact")} /></Field>
          <Field label="ความต้องการสนับสนุนเฉพาะด้าน"><input className={inputClass} disabled={!canEdit} {...personalForm.register("SupportNeeds")} /></Field>
          {canEdit && (
            <div className="md:col-span-3">
              <Button type="submit" disabled={saving === "personal"}>{saving === "personal" ? "กำลังบันทึก..." : "บันทึกข้อมูลส่วนบุคคล"}</Button>
            </div>
          )}
        </form>
      </Card>

      <Card title="ประวัติการศึกษา">
        <form onSubmit={eduForm.handleSubmit(saveEducation)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="วุฒิปริญญาตรี"><input className={inputClass} disabled={!canEdit} {...eduForm.register("BachelorDegree")} /></Field>
          <Field label="สถาบัน"><input className={inputClass} disabled={!canEdit} {...eduForm.register("Institution")} /></Field>
          <Field label="ปีที่จบ"><input className={inputClass} disabled={!canEdit} {...eduForm.register("GraduationYear")} /></Field>
          <Field label="GPA ปริญญาตรี"><input className={inputClass} disabled={!canEdit} {...eduForm.register("BachelorGPA")} /></Field>
          <Field label="การศึกษาเพิ่มเติม/ประกาศนียบัตร"><input className={inputClass} disabled={!canEdit} {...eduForm.register("AdditionalEducation")} /></Field>
          <Field label="ผลสอบภาษาอังกฤษก่อนเข้าศึกษา"><input className={inputClass} disabled={!canEdit} {...eduForm.register("PreAdmissionEnglishScore")} /></Field>
          {canEdit && (
            <div className="md:col-span-3">
              <Button type="submit" disabled={saving === "education"}>{saving === "education" ? "กำลังบันทึก..." : "บันทึกประวัติการศึกษา"}</Button>
            </div>
          )}
        </form>
      </Card>

      <Card title="ประวัติวิชาชีพ">
        <form onSubmit={profForm.handleSubmit(saveProfessional)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="เลขที่ใบอนุญาต"><input className={inputClass} disabled={!canEdit} {...profForm.register("LicenseNumber")} /></Field>
          <Field label="วันหมดอายุใบอนุญาต"><input type="date" className={inputClass} disabled={!canEdit} {...profForm.register("LicenseExpiry")} /></Field>
          <Field label="สถานที่ปฏิบัติงาน"><input className={inputClass} disabled={!canEdit} {...profForm.register("Workplace")} /></Field>
          <Field label="ตำแหน่ง/หน่วยงาน"><input className={inputClass} disabled={!canEdit} {...profForm.register("PositionDept")} /></Field>
          <Field label="ระยะเวลาปฏิบัติงาน"><input className={inputClass} disabled={!canEdit} {...profForm.register("WorkDuration")} /></Field>
          <Field label="ประสบการณ์ดูแลผู้สูงอายุ"><input className={inputClass} disabled={!canEdit} {...profForm.register("ElderlyCareExperience")} /></Field>
          <Field label="ความเชี่ยวชาญ/ความสนใจเฉพาะด้าน"><input className={inputClass} disabled={!canEdit} {...profForm.register("Specialization")} /></Field>
          <Field label="ประวัติการอบรม (BLS, ACLS, ฯลฯ)"><input className={inputClass} disabled={!canEdit} {...profForm.register("TrainingHistory")} /></Field>
          {canEdit && (
            <div className="md:col-span-3">
              <Button type="submit" disabled={saving === "professional"}>{saving === "professional" ? "กำลังบันทึก..." : "บันทึกประวัติวิชาชีพ"}</Button>
            </div>
          )}
        </form>
      </Card>

      <Card title="เป้าหมายของนักศึกษา">
        <form onSubmit={goalsForm.handleSubmit(saveGoals)} className="grid grid-cols-1 gap-4">
          <Field label="เหตุผลที่เข้าศึกษาในหลักสูตร"><textarea className={inputClass} rows={2} disabled={!canEdit} {...goalsForm.register("ReasonForEnrollment")} /></Field>
          <Field label="เป้าหมายทางวิชาการ"><textarea className={inputClass} rows={2} disabled={!canEdit} {...goalsForm.register("AcademicGoals")} /></Field>
          <Field label="เป้าหมายทางวิชาชีพ"><textarea className={inputClass} rows={2} disabled={!canEdit} {...goalsForm.register("ProfessionalGoals")} /></Field>
          <Field label="ประเด็นที่สนใจทำวิทยานิพนธ์"><textarea className={inputClass} rows={2} disabled={!canEdit} {...goalsForm.register("ThesisInterest")} /></Field>
          <Field label="สมรรถนะที่ต้องการพัฒนา"><textarea className={inputClass} rows={2} disabled={!canEdit} {...goalsForm.register("CompetenciesToImprove")} /></Field>
          <Field label="แผนพัฒนารายบุคคล (IDP)"><textarea className={inputClass} rows={3} disabled={!canEdit} {...goalsForm.register("IDP")} /></Field>
          {canEdit && (
            <div>
              <Button type="submit" disabled={saving === "goals"}>{saving === "goals" ? "กำลังบันทึก..." : "บันทึกเป้าหมาย"}</Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
