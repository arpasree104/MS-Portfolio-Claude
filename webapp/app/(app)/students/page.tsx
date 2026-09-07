import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import type { Student, Division } from "@/lib/types";
import { StudentListView } from "@/components/students/StudentListView";

export default async function StudentsPage() {
  const session = await requireActiveSession();
  const [students, divisions] = await Promise.all([
    callGas<Student[]>("listStudents", session.user.email!, { filters: {} }),
    callGas<Division[]>("listDivisions", session.user.email!, { activeOnly: true }),
  ]);

  return <StudentListView students={students} divisions={divisions} />;
}
