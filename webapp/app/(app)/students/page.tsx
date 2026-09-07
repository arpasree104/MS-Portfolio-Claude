import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import type { StudentActivityRow, Division } from "@/lib/types";
import { StudentActivityRoster } from "@/components/students/StudentActivityRoster";

export default async function StudentsPage() {
  const session = await requireActiveSession();
  const [students, divisions] = await Promise.all([
    callGas<StudentActivityRow[]>("listStudentsWithActivity", session.user.email!, { filters: {} }),
    callGas<Division[]>("listDivisions", session.user.email!, { activeOnly: true }),
  ]);

  return (
    <StudentActivityRoster
      students={students}
      divisions={divisions}
      hrefPattern="/students/{id}/profile"
      linkLabel="ดูข้อมูล"
      title="นักศึกษาทั้งหมด"
      columns={["status"]}
    />
  );
}
