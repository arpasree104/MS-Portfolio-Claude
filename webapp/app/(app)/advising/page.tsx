import { redirect } from "next/navigation";
import { requireActiveSession } from "@/lib/get-session";
import { getMyStudentId } from "@/lib/my-student";
import { callGas } from "@/lib/gas-server";
import type { StudentActivityRow, Division } from "@/lib/types";
import { StudentActivityRoster } from "@/components/students/StudentActivityRoster";

export default async function AdvisingLandingPage() {
  const session = await requireActiveSession();

  if (session.user.role === "student") {
    const studentId = await getMyStudentId(session.user.email!);
    if (!studentId) redirect("/dashboard");
    redirect(`/students/${studentId}/profile/advising`);
  }

  const [students, divisions] = await Promise.all([
    callGas<StudentActivityRow[]>("listStudentsWithActivity", session.user.email!, { filters: {} }),
    callGas<Division[]>("listDivisions", session.user.email!, { activeOnly: true }),
  ]);

  return (
    <StudentActivityRoster
      students={students}
      divisions={divisions}
      hrefPattern="/students/{id}/profile/advising"
      linkLabel="เปิดบันทึก"
      title="เลือกนักศึกษาเพื่อดู/บันทึกการให้คำปรึกษา"
    />
  );
}
