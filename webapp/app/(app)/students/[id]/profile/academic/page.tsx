import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import type { AcademicSummary, CourseEnrollment } from "@/lib/types";
import { AcademicTabView } from "@/components/profile/AcademicTabView";

export default async function AcademicTab({ params }: { params: { id: string } }) {
  const session = await requireActiveSession();
  const studentId = params.id;

  const [courses, academic] = await Promise.all([
    callGas<CourseEnrollment[]>("listCourseEnrollments", session.user.email!, { studentId, filters: {} }),
    callGas<AcademicSummary>("getAcademicSummary", session.user.email!, { studentId }),
  ]);

  const canEdit = session.user.role === "student" || session.user.role === "admin";

  return <AcademicTabView studentId={studentId} initialCourses={courses} academic={academic} canEdit={canEdit} />;
}
