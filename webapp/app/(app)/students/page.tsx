import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import type { Student } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

const STATUS_TONE: Record<string, "green" | "yellow" | "red" | "gray"> = {
  "กำลังศึกษา": "green",
  "ลาพักการศึกษา": "yellow",
  "รักษาสถานภาพ": "yellow",
  "สำเร็จการศึกษา": "gray",
  "พ้นสภาพ": "red",
};

export default async function StudentsPage() {
  const session = await requireActiveSession();
  const students = await callGas<Student[]>("listStudents", session.user.email!, { filters: {} });

  return (
    <Card title={`นักศึกษาทั้งหมด (${students.length} คน)`}>
      <Table>
        <Thead>
          <Th>รหัสนักศึกษา</Th>
          <Th>ชื่อ-สกุล</Th>
          <Th>รุ่น</Th>
          <Th>สถานภาพ</Th>
          <Th>{" "}</Th>
        </Thead>
        <tbody>
          {students.map((s) => (
            <Tr key={s.StudentId}>
              <Td className="font-mono text-xs">{s.StudentCode || "-"}</Td>
              <Td>{s.PrefixTH}{s.FirstNameTH} {s.LastNameTH}</Td>
              <Td>{s.Cohort}</Td>
              <Td><Badge tone={STATUS_TONE[s.EnrollmentStatus] || "gray"}>{s.EnrollmentStatus}</Badge></Td>
              <Td>
                <Link href={`/students/${s.StudentId}/profile`} className="text-primary text-sm hover:underline">
                  ดูข้อมูล
                </Link>
              </Td>
            </Tr>
          ))}
          {students.length === 0 && (
            <Tr><Td className="text-center text-foreground/40 py-8">ยังไม่มีนักศึกษาในความดูแล</Td></Tr>
          )}
        </tbody>
      </Table>
    </Card>
  );
}
