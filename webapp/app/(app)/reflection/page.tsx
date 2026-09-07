import { redirect } from "next/navigation";
import { requireActiveSession } from "@/lib/get-session";
import { getMyStudentId } from "@/lib/my-student";
import { callGas } from "@/lib/gas-server";
import type { EvaluatedPeriod, ProgressEvaluation, Reflection, Student } from "@/lib/types";
import { ReflectionView } from "@/components/reflection/ReflectionView";
import { Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import Link from "next/link";

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
    const students = await callGas<Student[]>("listStudents", session.user.email!, { filters: {} });
    return (
      <Card title="เลือกนักศึกษาเพื่อดู Reflection และแบบประเมิน">
        <Table>
          <Thead><Th>รหัสนักศึกษา</Th><Th>ชื่อ-สกุล</Th><Th>รุ่น</Th><Th>{" "}</Th></Thead>
          <tbody>
            {students.map((s) => (
              <Tr key={s.StudentId}>
                <Td className="font-mono text-xs">{s.StudentCode}</Td>
                <Td>{s.PrefixTH}{s.FirstNameTH} {s.LastNameTH}</Td>
                <Td>{s.Cohort}</Td>
                <Td><Link href={`/reflection?studentId=${s.StudentId}`} className="text-primary text-sm hover:underline">เปิดดู</Link></Td>
              </Tr>
            ))}
            {students.length === 0 && <Tr><Td className="text-center text-foreground/40 py-8">ยังไม่มีนักศึกษาในความดูแล</Td></Tr>}
          </tbody>
        </Table>
      </Card>
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
