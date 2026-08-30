import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import { getMyStudentId } from "@/lib/my-student";
import type { Student } from "@/lib/types";
import { AdvisorSelectView } from "@/components/settings/AdvisorSelectView";
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

  const [{ student }, advisors] = await Promise.all([
    callGas<{ student: Student }>("getStudentProfile", session.user.email!, { studentId }),
    callGas<AdvisorOption[]>("listAdvisors", session.user.email!, {}),
  ]);

  return <AdvisorSelectView studentId={studentId} student={student} advisors={advisors} />;
}
