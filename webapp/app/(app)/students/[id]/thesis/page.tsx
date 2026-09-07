import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import type { ThesisDetail } from "@/lib/types";
import { ThesisView } from "@/components/thesis/ThesisView";

interface CohortRow { cohort: string; total: number; completed: number; inProgress: number; notStarted: number }

export default async function StudentThesisPage({ params }: { params: { id: string } }) {
  const session = await requireActiveSession();
  const studentId = params.id;
  const role = session.user.role;

  const [detail, cohortChart] = await Promise.all([
    callGas<ThesisDetail | null>("getThesisByStudent", session.user.email!, { studentId }),
    callGas<CohortRow[]>("getThesisProgressByCohort", session.user.email!, {}),
  ]);

  return (
    <ThesisView
      studentId={studentId}
      initialDetail={detail}
      canCertify={role === "advisor" || role === "admin"}
      canEditDetail={role === "student" || role === "advisor" || role === "admin"}
      canStartThesis={role === "student" || role === "admin"}
      cohortChart={cohortChart}
    />
  );
}
