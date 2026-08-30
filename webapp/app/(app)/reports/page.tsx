import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import { redirect } from "next/navigation";
import { Card, StatCard } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Users, FileText, AlertTriangle } from "lucide-react";

interface ProgramReport {
  studentCountByCohortStatus: Record<string, Record<string, number>>;
  gpaAverageByCohort: { cohort: string; averageGpax: number }[];
  riskStudents: { studentId: string; studentCode: string; name: string; cohort: string; gpax: number }[];
  thesisStepDurations: { step: number; averageDaysFromPlan: number }[];
  thesisExamPassCounts: { proposalExamPassed: number; finalExamPassed: number };
  publicationCount: number;
  ploSummaryByCohort: { cohort: string; plo: string; averageLevel: number | null }[];
  totalStudents: number;
}

export default async function ReportsPage() {
  const session = await requireActiveSession();
  if (session.user.role !== "executive" && session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const report = await callGas<ProgramReport>("generateProgramReport", session.user.email!, {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users size={22} />} label="นักศึกษาทั้งหมด" value={report.totalStudents} tone="primary" />
        <StatCard icon={<AlertTriangle size={22} />} label="นักศึกษาเสี่ยง (GPAX ต่ำกว่าเกณฑ์)" value={report.riskStudents.length} tone="red" />
        <StatCard icon={<FileText size={22} />} label="มีผลงานตีพิมพ์แล้ว" value={report.publicationCount} tone="green" />
        <StatCard icon={<Users size={22} />} label="สอบวิทยานิพนธ์ผ่านแล้ว" value={report.thesisExamPassCounts.finalExamPassed} tone="blue" />
      </div>

      <Card title="GPAX เฉลี่ยรายรุ่น">
        <Table>
          <Thead><Th>รุ่น</Th><Th>GPAX เฉลี่ย</Th></Thead>
          <tbody>
            {report.gpaAverageByCohort.map((c) => (
              <Tr key={c.cohort}><Td>รุ่น {c.cohort}</Td><Td>{c.averageGpax}</Td></Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card title="นักศึกษาที่มีความเสี่ยงทางการเรียน (GPAX ต่ำกว่า 3.00)">
        <Table>
          <Thead><Th>รหัส</Th><Th>ชื่อ-สกุล</Th><Th>รุ่น</Th><Th>GPAX</Th></Thead>
          <tbody>
            {report.riskStudents.map((s) => (
              <Tr key={s.studentId}>
                <Td className="font-mono text-xs">{s.studentCode}</Td>
                <Td>{s.name}</Td>
                <Td>{s.cohort}</Td>
                <Td><Badge tone="red">{s.gpax}</Badge></Td>
              </Tr>
            ))}
            {report.riskStudents.length === 0 && <Tr><Td className="text-center text-foreground/40 py-6">ไม่มีนักศึกษาความเสี่ยง</Td></Tr>}
          </tbody>
        </Table>
      </Card>

      <Card title="ระยะเวลาเฉลี่ยแต่ละขั้นตอนวิทยานิพนธ์ (วันจากแผน)">
        <Table>
          <Thead><Th>ขั้นตอน</Th><Th>ระยะเวลาเฉลี่ย (วัน)</Th></Thead>
          <tbody>
            {report.thesisStepDurations.map((d) => (
              <Tr key={d.step}><Td>ขั้นที่ {d.step}</Td><Td>{d.averageDaysFromPlan}</Td></Tr>
            ))}
            {report.thesisStepDurations.length === 0 && <Tr><Td className="text-center text-foreground/40 py-6">ยังไม่มีข้อมูล</Td></Tr>}
          </tbody>
        </Table>
      </Card>

      <Card title="ระดับการบรรลุ PLO เฉลี่ยรายรุ่น">
        <Table>
          <Thead><Th>รุ่น</Th><Th>PLO</Th><Th>ระดับเฉลี่ย (1-4)</Th></Thead>
          <tbody>
            {report.ploSummaryByCohort.map((p, i) => (
              <Tr key={i}><Td>รุ่น {p.cohort}</Td><Td>{p.plo}</Td><Td>{p.averageLevel ?? "-"}</Td></Tr>
            ))}
            {report.ploSummaryByCohort.length === 0 && <Tr><Td className="text-center text-foreground/40 py-6">ยังไม่มีข้อมูล</Td></Tr>}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
