import { requireActiveSession } from "@/lib/get-session";
import { callGasCached } from "@/lib/gas-server";
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
  const studentIdPayload = JSON.stringify({ studentId });

  const [{ student }, academic, thesis, portfolio] = await Promise.all([
    callGasCached<{ student: Student }>("getStudentProfile", session.user.email!, studentIdPayload),
    callGasCached<AcademicSummary>("getAcademicSummary", session.user.email!, studentIdPayload),
    callGasCached<ThesisDetail | null>("getThesisByStudent", session.user.email!, studentIdPayload).then(
      (r): ThesisProgress | null => (r ? r.thesis : null)
    ),
    callGasCached<PortfolioItem[]>("listPortfolioItems", session.user.email!, studentIdPayload),
  ]);

  return (
    <div className="space-y-4">
      <ProfileHeader student={student} academic={academic} thesis={thesis} portfolioCount={portfolio.length} />
      <ProfileTabs studentId={studentId} />
      {children}
    </div>
  );
}
