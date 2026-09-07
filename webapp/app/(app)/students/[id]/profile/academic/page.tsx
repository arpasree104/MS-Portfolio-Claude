import { requireActiveSession } from "@/lib/get-session";
import { callGas, callGasCached } from "@/lib/gas-server";
import type { AcademicSummary, CourseEnrollment, CourseCatalogItem } from "@/lib/types";
import { AcademicTabView } from "@/components/profile/AcademicTabView";

export default async function AcademicTab({ params }: { params: { id: string } }) {
  const session = await requireActiveSession();
  const studentId = params.id;

  const [courses, academic, courseCatalog] = await Promise.all([
    callGas<CourseEnrollment[]>("listCourseEnrollments", session.user.email!, { studentId, filters: {} }),
    // Same action + payload as the profile layout's getAcademicSummary call — reused via
    // React's per-request cache instead of hitting GAS a second time.
    callGasCached<AcademicSummary>("getAcademicSummary", session.user.email!, JSON.stringify({ studentId })),
    callGas<CourseCatalogItem[]>("listCourseCatalog", session.user.email!, { activeOnly: true }),
  ]);

  const canEdit = session.user.role === "student" || session.user.role === "admin";

  return (
    <AcademicTabView
      studentId={studentId}
      initialCourses={courses}
      academic={academic}
      canEdit={canEdit}
      courseCatalog={courseCatalog}
    />
  );
}
