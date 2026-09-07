"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import type { StudentActivityRow, Division } from "@/lib/types";
import { MessageSquare, GraduationCap, Lightbulb, Circle, Search } from "lucide-react";

const STALE_YELLOW_DAYS = 30;
const STALE_RED_DAYS = 60;

const STATUS_TONE: Record<string, "green" | "yellow" | "red" | "gray"> = {
  "กำลังศึกษา": "green",
  "ลาพักการศึกษา": "yellow",
  "รักษาสถานภาพ": "yellow",
  "สำเร็จการศึกษา": "gray",
  "พ้นสภาพ": "red",
};

export type RosterColumn = "advising" | "thesis" | "reflection" | "status";

// Divisions are shown in this fixed priority order (by keyword match against NameTH)
// rather than alphabetically, per how the program wants the roster read at a glance.
// Anything not matching one of these keywords falls after them, in alphabetical order;
// students with no division assigned always come last.
const DIVISION_PRIORITY_KEYWORDS = ["ผู้ใหญ่", "ชุมชน", "จิตเวช"];

function divisionSortRank(divisionId: string, divisionName: string) {
  if (divisionId === "__none__") return DIVISION_PRIORITY_KEYWORDS.length + 1;
  const idx = DIVISION_PRIORITY_KEYWORDS.findIndex((kw) => divisionName.includes(kw));
  return idx === -1 ? DIVISION_PRIORITY_KEYWORDS.length : idx;
}

function daysSince(iso: string | null) {
  if (!iso) return Infinity;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

/** Picks which "last activity" timestamp to show, matching the columns shown on this
 *  page — e.g. the thesis page shows only thesis activity, not any student data edit,
 *  so it doesn't look like thesis progress happened when the student just uploaded a
 *  photo. Falls back to the broad lastActivityAt when no single topic column is shown
 *  (the all-students roster, or a page showing more than one topic column). */
function pickActivityTimestamp(s: StudentActivityRow, columns: RosterColumn[]) {
  const topicColumns = columns.filter((c) => c === "advising" || c === "thesis" || c === "reflection");
  if (topicColumns.length === 1) {
    if (topicColumns[0] === "advising") return s.lastAdvisingActivityAt;
    if (topicColumns[0] === "thesis") return s.lastThesisActivityAt;
    if (topicColumns[0] === "reflection") return s.lastReflectionActivityAt;
  }
  return s.lastActivityAt;
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
  hrefPattern,
  linkLabel,
  title,
  columns = ["advising", "thesis", "reflection"],
}: {
  students: StudentActivityRow[];
  divisions: Division[];
  /** A URL template containing the literal placeholder "{id}", e.g. "/students/{id}/thesis"
   *  — a function prop can't cross the server/client boundary from a Server Component
   *  page into this Client Component, so the link is built from a plain string instead. */
  hrefPattern: string;
  linkLabel: string;
  title: string;
  /** Which activity columns to show in the summary table — keep this to only what's
   *  relevant to the page it's shown on (e.g. just "reflection" on the Reflection
   *  picker) rather than always computing/rendering all three; open a student's own
   *  profile to see the other two. Defaults to all three for backward compatibility. */
  columns?: RosterColumn[];
}) {
  const [search, setSearch] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [cohort, setCohort] = useState("");

  const cohorts = useMemo(() => {
    const set = new Set(students.map((s) => (s.cohort ? String(s.cohort) : "")).filter(Boolean));
    return Array.from(set).sort();
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (q) {
        const haystack = `${s.name} ${s.studentCode}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (divisionId && s.divisionId !== divisionId) return false;
      if (cohort && String(s.cohort) !== cohort) return false;
      return true;
    });
  }, [students, search, divisionId, cohort]);

  const grouped = useMemo(() => {
    const byDivision = new Map<string, StudentActivityRow[]>();
    filtered.forEach((s) => {
      const key = s.divisionId || "__none__";
      if (!byDivision.has(key)) byDivision.set(key, []);
      byDivision.get(key)!.push(s);
    });

    const divisionName = new Map(divisions.map((d) => [d.DivisionId, d.NameTH]));

    const groups = Array.from(byDivision.entries()).map(([divId, rows]) => {
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
        .map(([cohortKey, students]) => ({
          cohort: cohortKey,
          students: students.sort((a, b) => a.name.localeCompare(b.name, "th")),
        }));
      return {
        divisionId: divId,
        divisionName: divId === "__none__" ? "ยังไม่ระบุสาขาวิชา" : divisionName.get(divId) || divId,
        cohortGroups,
      };
    });

    return groups.sort((a, b) => {
      const rankDiff = divisionSortRank(a.divisionId, a.divisionName) - divisionSortRank(b.divisionId, b.divisionName);
      return rankDiff !== 0 ? rankDiff : a.divisionName.localeCompare(b.divisionName, "th");
    });
  }, [filtered, divisions]);

  if (students.length === 0) {
    return (
      <Card title={title}>
        <p className="text-center text-foreground/40 py-8 text-sm">ยังไม่มีนักศึกษาในความดูแล</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col md:flex-row gap-3">
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
      </Card>

      <div className="flex flex-wrap items-center gap-4 text-xs text-foreground/60 bg-black/[0.02] rounded-lg px-4 py-2.5">
        <span className="font-medium">สัญลักษณ์การเคลื่อนไหวล่าสุด:</span>
        <span className="inline-flex items-center gap-1.5"><Circle size={9} className="text-status-green fill-current" /> ภายใน {STALE_YELLOW_DAYS} วัน</span>
        <span className="inline-flex items-center gap-1.5"><Circle size={9} className="text-status-yellow-text fill-current" /> {STALE_YELLOW_DAYS}-{STALE_RED_DAYS} วัน</span>
        <span className="inline-flex items-center gap-1.5"><Circle size={9} className="text-status-red fill-current" /> เกิน {STALE_RED_DAYS} วัน / ไม่เคยบันทึก</span>
        <span className="ml-auto">แสดง {filtered.length}/{students.length} คน</span>
      </div>

      {filtered.length === 0 && (
        <Card>
          <p className="text-center text-foreground/40 py-8 text-sm">ไม่พบนักศึกษาที่ตรงกับเงื่อนไข</p>
        </Card>
      )}

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
                    {columns.includes("advising") && <Th><span className="inline-flex items-center gap-1"><MessageSquare size={13} /> คำปรึกษา</span></Th>}
                    {columns.includes("thesis") && <Th><span className="inline-flex items-center gap-1"><GraduationCap size={13} /> วิทยานิพนธ์</span></Th>}
                    {columns.includes("reflection") && <Th><span className="inline-flex items-center gap-1"><Lightbulb size={13} /> Reflection</span></Th>}
                    {columns.includes("status") && <Th>สถานภาพ</Th>}
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
                        {columns.includes("advising") && (
                          <Td>{s.advisingLogCount > 0 ? <Badge tone="primary">{s.advisingLogCount} ครั้ง</Badge> : <span className="text-xs text-foreground/40">-</span>}</Td>
                        )}
                        {columns.includes("thesis") && (
                          <Td>{s.hasThesis ? <Badge tone="primary">ขั้นที่ {s.thesisCurrentStep}</Badge> : <span className="text-xs text-foreground/40">ยังไม่เริ่ม</span>}</Td>
                        )}
                        {columns.includes("reflection") && (
                          <Td>{s.reflectionCount > 0 ? <Badge tone="green">{s.reflectionCount} ครั้ง</Badge> : <span className="text-xs text-foreground/40">-</span>}</Td>
                        )}
                        {columns.includes("status") && (
                          <Td><Badge tone={STATUS_TONE[s.enrollmentStatus] || "gray"}>{s.enrollmentStatus}</Badge></Td>
                        )}
                        <Td><ActivityDot lastActivityAt={pickActivityTimestamp(s, columns)} /></Td>
                        <Td>
                          <Link href={hrefPattern.replace("{id}", s.studentId)} className="text-primary text-sm hover:underline">
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
