import { redirect } from "next/navigation";
import { requireActiveSession } from "@/lib/get-session";
import { getMyStudentId } from "@/lib/my-student";
import { callGas } from "@/lib/gas-server";
import type { EvaluatedPeriod, ProgressEvaluation, Reflection, StudentActivityRow, Division } from "@/lib/types";
import { ReflectionView } from "@/components/reflection/ReflectionView";
import { StudentActivityRoster } from "@/components/students/StudentActivityRoster";

function currentAcademicPeriod() {
  const now = new Date();
  const buddhistYear = now.getFullYear() + 543;
  const month = now.getMonth() + 1;
  const semester = month >= 6 && month <= 10 ? "1" : month >= 11 || month <= 3 ? "2" : "summer";
  return { academicYear: String(buddhistYear), semester };
}

export default async function ReflectionLandingPage({
  searchParams,
}: {
  searchParams: { studentId?: string; academicYear?: string; semester?: string };
}) {
  const session = await requireActiveSession();
  const current = currentAcademicPeriod();
  const academicYear = searchParams.academicYear || current.academicYear;
  const semester = searchParams.semester || current.semester;

  let studentId = searchParams.studentId;

  if (session.user.role === "student") {
    studentId = (await getMyStudentId(session.user.email!)) || undefined;
    if (!studentId) redirect("/dashboard");
  }

  if (!studentId) {
    const [students, divisions] = await Promise.all([
      callGas<StudentActivityRow[]>("listStudentsWithActivity", session.user.email!, { filters: {} }),
      callGas<Division[]>("listDivisions", session.user.email!, { activeOnly: true }),
    ]);
    return (
      <StudentActivityRoster
        students={students}
        divisions={divisions}
        hrefFor={(id) => `/reflection?studentId=${id}`}
        linkLabel="เปิดดู"
        title="เลือกนักศึกษาเพื่อดู Reflection และแบบประเมิน"
      />
    );
  }

  const [reflections, evaluation, evaluatedPeriods] = await Promise.all([
    callGas<Reflection[]>("listReflections", session.user.email!, { studentId }),
    callGas<ProgressEvaluation[]>("getProgressEvaluation", session.user.email!, { studentId, academicYear, semester }),
    callGas<EvaluatedPeriod[]>("listEvaluatedPeriods", session.user.email!, { studentId }),
  ]);

  return (
    <ReflectionView
      studentId={studentId}
      initialReflections={reflections}
      initialEvaluation={evaluation}
      initialEvaluatedPeriods={evaluatedPeriods}
      academicYear={academicYear}
      semester={semester}
      isStudent={session.user.role === "student"}
      isAdvisor={session.user.role === "advisor" || session.user.role === "admin"}
    />
  );
}
