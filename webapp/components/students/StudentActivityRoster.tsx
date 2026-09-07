"use client";
import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import type { StudentActivityRow, Division } from "@/lib/types";
import { MessageSquare, GraduationCap, Lightbulb, Circle } from "lucide-react";

const STALE_YELLOW_DAYS = 30;
const STALE_RED_DAYS = 60;

function daysSince(iso: string | null) {
  if (!iso) return Infinity;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function ActivityDot({ lastActivityAt }: { lastActivityAt: string | null }) {
  const days = daysSince(lastActivityAt);
  const tone = days >= STALE_RED_DAYS ? "text-status-red" : days >= STALE_YELLOW_DAYS ? "text-status-yellow-text" : "text-status-green";
  const label = lastActivityAt
    ? days === 0 ? "วันนี้" : `${days} วันก่อน`
    : "ยังไม่มีการบันทึก";
  return (
    <span className="inline-flex items-center gap-1.5" title={label}>
      <Circle size={9} className={`${tone} fill-current`} />
      <span className="text-xs text-foreground/60">{label}</span>
    </span>
  );
}

export function StudentActivityRoster({
  students,
  divisions,
  hrefFor,
  linkLabel,
  title,
}: {
  students: StudentActivityRow[];
  divisions: Division[];
  hrefFor: (studentId: string) => string;
  linkLabel: string;
  title: string;
}) {
  const grouped = useMemo(() => {
    const byDivision = new Map<string, StudentActivityRow[]>();
    students.forEach((s) => {
      const key = s.divisionId || "__none__";
      if (!byDivision.has(key)) byDivision.set(key, []);
      byDivision.get(key)!.push(s);
    });

    const divisionName = new Map(divisions.map((d) => [d.DivisionId, d.NameTH]));

    const groups = Array.from(byDivision.entries()).map(([divisionId, rows]) => {
      const byCohort = new Map<string, StudentActivityRow[]>();
      rows.forEach((s) => {
        // s.cohort comes back from the sheet as a number (not the string the type
        // declares), so this must be coerced before it's used as a Map key/sorted —
        // otherwise .localeCompare below throws since it's not a string method.
        const key = s.cohort ? String(s.cohort) : "-";
        if (!byCohort.has(key)) byCohort.set(key, []);
        byCohort.get(key)!.push(s);
      });
      const cohortGroups = Array.from(byCohort.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([cohort, students]) => ({
          cohort,
          students: students.sort((a, b) => a.name.localeCompare(b.name, "th")),
        }));
      return {
        divisionId,
        divisionName: divisionId === "__none__" ? "ยังไม่ระบุสาขาวิชา" : divisionName.get(divisionId) || divisionId,
        cohortGroups,
      };
    });

    return groups.sort((a, b) => a.divisionName.localeCompare(b.divisionName, "th"));
  }, [students, divisions]);

  if (students.length === 0) {
    return (
      <Card title={title}>
        <p className="text-center text-foreground/40 py-8 text-sm">ยังไม่มีนักศึกษาในความดูแล</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-xs text-foreground/60 bg-black/[0.02] rounded-lg px-4 py-2.5">
        <span className="font-medium">สัญลักษณ์การเคลื่อนไหวล่าสุด:</span>
        <span className="inline-flex items-center gap-1.5"><Circle size={9} className="text-status-green fill-current" /> ภายใน {STALE_YELLOW_DAYS} วัน</span>
        <span className="inline-flex items-center gap-1.5"><Circle size={9} className="text-status-yellow-text fill-current" /> {STALE_YELLOW_DAYS}-{STALE_RED_DAYS} วัน</span>
        <span className="inline-flex items-center gap-1.5"><Circle size={9} className="text-status-red fill-current" /> เกิน {STALE_RED_DAYS} วัน / ไม่เคยบันทึก</span>
      </div>

      {grouped.map((group) => (
        <Card key={group.divisionId} title={`${group.divisionName} (${group.cohortGroups.reduce((sum, c) => sum + c.students.length, 0)} คน)`}>
          <div className="space-y-5">
            {group.cohortGroups.map((cg) => (
              <div key={cg.cohort}>
                <p className="text-xs font-semibold text-primary mb-2">รุ่น {cg.cohort}</p>
                <Table>
                  <Thead>
                    <Th>{" "}</Th>
                    <Th>รหัสนักศึกษา</Th>
                    <Th>ชื่อ-สกุล</Th>
                    <Th><span className="inline-flex items-center gap-1"><MessageSquare size={13} /> คำปรึกษา</span></Th>
                    <Th><span className="inline-flex items-center gap-1"><GraduationCap size={13} /> วิทยานิพนธ์</span></Th>
                    <Th><span className="inline-flex items-center gap-1"><Lightbulb size={13} /> Reflection</span></Th>
                    <Th>เคลื่อนไหวล่าสุด</Th>
                    <Th>{" "}</Th>
                  </Thead>
                  <tbody>
                    {cg.students.map((s) => (
                      <Tr key={s.studentId}>
                        <Td>
                          {s.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-black/5" />
                          )}
                        </Td>
                        <Td className="font-mono text-xs">{s.studentCode || "-"}</Td>
                        <Td>{s.name}</Td>
                        <Td>{s.advisingLogCount > 0 ? <Badge tone="primary">{s.advisingLogCount} ครั้ง</Badge> : <span className="text-xs text-foreground/40">-</span>}</Td>
                        <Td>{s.hasThesis ? <Badge tone="primary">ขั้นที่ {s.thesisCurrentStep}</Badge> : <span className="text-xs text-foreground/40">ยังไม่เริ่ม</span>}</Td>
                        <Td>{s.reflectionCount > 0 ? <Badge tone="green">{s.reflectionCount} ครั้ง</Badge> : <span className="text-xs text-foreground/40">-</span>}</Td>
                        <Td><ActivityDot lastActivityAt={s.lastActivityAt} /></Td>
                        <Td>
                          <Link href={hrefFor(s.studentId)} className="text-primary text-sm hover:underline">
                            {linkLabel}
                          </Link>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
