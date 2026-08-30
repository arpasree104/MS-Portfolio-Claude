import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import { getMyStudentId } from "@/lib/my-student";
import type { Division, Student } from "@/lib/types";
import { AdvisorSelectView } from "@/components/settings/AdvisorSelectView";
import { DivisionSelectView } from "@/components/settings/DivisionSelectView";
import { Card } from "@/components/ui/Card";

interface AdvisorOption { userId: string; displayNameTH: string; displayNameEN: string; email: string }

export default async function SettingsPage() {
  const session = await requireActiveSession();

  if (session.user.role !== "student") {
    return (
      <Card title="ตั้งค่า">
        <p className="text-sm text-foreground/60">
          บัญชีนี้เข้าสู่ระบบผ่าน Google Sign-In ไม่มีรหัสผ่านแยกต่างหาก
          หากต้องการเปลี่ยนสิทธิ์การเข้าถึงกรุณาติดต่อผู้ดูแลระบบ
        </p>
      </Card>
    );
  }

  const studentId = await getMyStudentId(session.user.email!);
  if (!studentId) {
    return <Card title="ตั้งค่า"><p className="text-sm text-foreground/60">ยังไม่มีข้อมูลนักศึกษาผูกกับบัญชีนี้</p></Card>;
  }

  const [{ student }, advisors, divisions] = await Promise.all([
    callGas<{ student: Student }>("getStudentProfile", session.user.email!, { studentId }),
    callGas<AdvisorOption[]>("listAdvisors", session.user.email!, {}),
    callGas<Division[]>("listDivisions", session.user.email!, { activeOnly: true }),
  ]);

  return (
    <div className="space-y-4">
      <DivisionSelectView studentId={studentId} currentDivisionId={student.DivisionId} divisions={divisions} />
      <AdvisorSelectView studentId={studentId} student={student} advisors={advisors} />
    </div>
  );
}
