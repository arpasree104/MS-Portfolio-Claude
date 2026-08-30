import { redirect } from "next/navigation";
import { requireActiveSession } from "@/lib/get-session";
import { getMyStudentId } from "@/lib/my-student";
import { callGas } from "@/lib/gas-server";
import type { Student } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import Link from "next/link";

export default async function ThesisLandingPage() {
  const session = await requireActiveSession();

  if (session.user.role === "student") {
    const studentId = await getMyStudentId(session.user.email!);
    if (!studentId) redirect("/dashboard");
    redirect(`/students/${studentId}/thesis`);
  }

  const students = await callGas<Student[]>("listStudents", session.user.email!, { filters: {} });

  return (
    <Card title="เลือกนักศึกษาเพื่อดูความก้าวหน้าวิทยานิพนธ์">
      <Table>
        <Thead>
          <Th>รหัสนักศึกษา</Th>
          <Th>ชื่อ-สกุล</Th>
          <Th>รุ่น</Th>
          <Th>{" "}</Th>
        </Thead>
        <tbody>
          {students.map((s) => (
            <Tr key={s.StudentId}>
              <Td className="font-mono text-xs">{s.StudentCode}</Td>
              <Td>{s.PrefixTH}{s.FirstNameTH} {s.LastNameTH}</Td>
              <Td>{s.Cohort}</Td>
              <Td>
                <Link href={`/students/${s.StudentId}/thesis`} className="text-primary text-sm hover:underline">
                  ดูความก้าวหน้า
                </Link>
              </Td>
            </Tr>
          ))}
          {students.length === 0 && <Tr><Td className="text-center text-foreground/40 py-8">ยังไม่มีนักศึกษาในความดูแล</Td></Tr>}
        </tbody>
      </Table>
    </Card>
  );
}
