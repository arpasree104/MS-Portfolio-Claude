"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import type { Student, Division } from "@/lib/types";

const STATUS_TONE: Record<string, "green" | "yellow" | "red" | "gray"> = {
  "กำลังศึกษา": "green",
  "ลาพักการศึกษา": "yellow",
  "รักษาสถานภาพ": "yellow",
  "สำเร็จการศึกษา": "gray",
  "พ้นสภาพ": "red",
};

function formatUpdatedAt(iso: string | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

export function StudentListView({ students, divisions }: { students: Student[]; divisions: Division[] }) {
  const [search, setSearch] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [cohort, setCohort] = useState("");

  const cohorts = useMemo(() => {
    const set = new Set(students.map((s) => s.Cohort).filter(Boolean));
    return Array.from(set).sort();
  }, [students]);

  const divisionName = useMemo(() => {
    const map: Record<string, string> = {};
    divisions.forEach((d) => { map[d.DivisionId] = d.NameTH; });
    return map;
  }, [divisions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (q) {
        const name = `${s.PrefixTH}${s.FirstNameTH} ${s.LastNameTH} ${s.FirstNameEN} ${s.LastNameEN} ${s.StudentCode}`.toLowerCase();
        if (!name.includes(q)) return false;
      }
      if (divisionId && s.DivisionId !== divisionId) return false;
      if (cohort && String(s.Cohort) !== cohort) return false;
      return true;
    });
  }, [students, search, divisionId, cohort]);

  return (
    <Card title={`นักศึกษาทั้งหมด (${filtered.length}/${students.length} คน)`}>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, นามสกุล, รหัสนักศึกษา..."
            className="w-full rounded-lg border border-black/10 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {divisions.length > 0 && (
          <select
            value={divisionId}
            onChange={(e) => setDivisionId(e.target.value)}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">ทุกสาขาวิชา</option>
            {divisions.map((d) => (
              <option key={d.DivisionId} value={d.DivisionId}>{d.NameTH}</option>
            ))}
          </select>
        )}
        <select
          value={cohort}
          onChange={(e) => setCohort(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">ทุกปีการศึกษา (รุ่น)</option>
          {cohorts.map((c) => (
            <option key={c} value={c}>รุ่น {c}</option>
          ))}
        </select>
      </div>

      <Table>
        <Thead>
          <Th>{" "}</Th>
          <Th>รหัสนักศึกษา</Th>
          <Th>ชื่อ-สกุล</Th>
          <Th>สาขาวิชา</Th>
          <Th>รุ่น</Th>
          <Th>สถานภาพ</Th>
          <Th>บันทึกข้อมูลล่าสุด</Th>
          <Th>{" "}</Th>
        </Thead>
        <tbody>
          {filtered.map((s) => (
            <Tr key={s.StudentId}>
              <Td>
                {s.PhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.PhotoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-black/5" />
                )}
              </Td>
              <Td className="font-mono text-xs">{s.StudentCode || "-"}</Td>
              <Td>{s.PrefixTH}{s.FirstNameTH} {s.LastNameTH}</Td>
              <Td>{divisionName[s.DivisionId || ""] || "-"}</Td>
              <Td>{s.Cohort}</Td>
              <Td><Badge tone={STATUS_TONE[s.EnrollmentStatus] || "gray"}>{s.EnrollmentStatus}</Badge></Td>
              <Td className="text-xs text-foreground/60">{formatUpdatedAt(s.UpdatedAt)}</Td>
              <Td>
                <Link href={`/students/${s.StudentId}/profile`} className="text-primary text-sm hover:underline">
                  ดูข้อมูล
                </Link>
              </Td>
            </Tr>
          ))}
          {filtered.length === 0 && (
            <Tr><Td className="text-center text-foreground/40 py-8" >ไม่พบนักศึกษาที่ตรงกับเงื่อนไข</Td></Tr>
          )}
        </tbody>
      </Table>
    </Card>
  );
}
