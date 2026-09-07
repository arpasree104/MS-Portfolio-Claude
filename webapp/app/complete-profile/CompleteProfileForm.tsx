"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { gasCall } from "@/lib/gas-client";
import { Button } from "@/components/ui/Button";

interface FormData {
  PrefixTH: string;
  FirstNameTH: string;
  LastNameTH: string;
  PrefixEN: string;
  FirstNameEN: string;
  LastNameEN: string;
  StudentCode: string;
  Cohort: string;
  AdmissionYear: string;
}

const inputClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground/60 mb-1 block">
        {label}{required && <span className="text-status-red"> *</span>}
      </span>
      {children}
    </label>
  );
}

export function CompleteProfileForm() {
  const router = useRouter();
  const { update } = useSession();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      PrefixTH: "", FirstNameTH: "", LastNameTH: "",
      PrefixEN: "", FirstNameEN: "", LastNameEN: "",
      StudentCode: "", Cohort: "", AdmissionYear: "",
    },
  });

  async function onSubmit(data: FormData) {
    if (saving) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      await gasCall("completeStudentProfile", { data });
      await update();
      router.push("/dashboard");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="คำนำหน้า (TH)" required><input className={inputClass} {...register("PrefixTH", { required: true })} /></Field>
        <Field label="ชื่อ (TH)" required><input className={inputClass} {...register("FirstNameTH", { required: true })} /></Field>
        <Field label="นามสกุล (TH)" required><input className={inputClass} {...register("LastNameTH", { required: true })} /></Field>
        <Field label="Prefix (EN)"><input className={inputClass} {...register("PrefixEN")} /></Field>
        <Field label="First Name (EN)"><input className={inputClass} {...register("FirstNameEN")} /></Field>
        <Field label="Last Name (EN)"><input className={inputClass} {...register("LastNameEN")} /></Field>
        <Field label="รหัสนักศึกษา"><input className={inputClass} {...register("StudentCode")} /></Field>
        <Field label="รุ่น (Cohort)"><input className={inputClass} {...register("Cohort")} /></Field>
        <Field label="ปีที่เข้าศึกษา"><input className={inputClass} {...register("AdmissionYear")} /></Field>
      </div>

      {errorMsg && <p className="text-sm text-status-red">{errorMsg}</p>}

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "กำลังบันทึก..." : "บันทึกและเข้าใช้งาน"}
      </Button>
    </form>
  );
}
