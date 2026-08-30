import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import type { AcademicSummary, ThesisDetail, ThesisProgress, PortfolioItem, Student } from "@/lib/types";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";

export default async function StudentProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const session = await requireActiveSession();
  const studentId = params.id;

  const [{ student }, academic, thesis, portfolio] = await Promise.all([
    callGas<{ student: Student }>("getStudentProfile", session.user.email!, { studentId }),
    callGas<AcademicSummary>("getAcademicSummary", session.user.email!, { studentId }),
    callGas<ThesisDetail | null>("getThesisByStudent", session.user.email!, { studentId }).then(
      (r): ThesisProgress | null => (r ? r.thesis : null)
    ),
    callGas<PortfolioItem[]>("listPortfolioItems", session.user.email!, { studentId }),
  ]);

  return (
    <div className="space-y-4">
      <ProfileHeader student={student} academic={academic} thesis={thesis} portfolioCount={portfolio.length} />
      <ProfileTabs studentId={studentId} />
      {children}
    </div>
  );
}
