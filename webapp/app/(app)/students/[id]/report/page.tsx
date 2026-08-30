import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import type {
  AcademicSummary, EducationHistory, PLOWithAssessment, PortfolioItem,
  ProfessionalHistory, Student, StudentGoals, ThesisDetail,
} from "@/lib/types";
import { PortfolioReport } from "@/components/report/PortfolioReport";

interface ProfileBundle {
  student: Student;
  education: EducationHistory[];
  professional: ProfessionalHistory[];
  goals: StudentGoals[];
}

export default async function StudentReportPage({ params }: { params: { id: string } }) {
  const session = await requireActiveSession();
  const studentId = params.id;

  const [profile, academic, plos, portfolio, thesis] = await Promise.all([
    callGas<ProfileBundle>("getStudentProfile", session.user.email!, { studentId }),
    callGas<AcademicSummary>("getAcademicSummary", session.user.email!, { studentId }),
    callGas<PLOWithAssessment[]>("listPLOAssessments", session.user.email!, { studentId }),
    callGas<PortfolioItem[]>("listPortfolioItems", session.user.email!, { studentId }),
    callGas<ThesisDetail | null>("getThesisByStudent", session.user.email!, { studentId }),
  ]);

  return (
    <PortfolioReport
      student={profile.student}
      education={profile.education[0] || null}
      professional={profile.professional[0] || null}
      goals={profile.goals[0] || null}
      academic={academic}
      plos={plos}
      portfolio={portfolio}
      thesis={thesis}
    />
  );
}
