import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import type { PLOWithAssessment } from "@/lib/types";
import { PLOTabView } from "@/components/profile/PLOTabView";

export default async function PLOTab({ params }: { params: { id: string } }) {
  const session = await requireActiveSession();
  const studentId = params.id;

  const plos = await callGas<PLOWithAssessment[]>("listPLOAssessments", session.user.email!, { studentId });

  const role = session.user.role;
  return (
    <PLOTabView
      studentId={studentId}
      initialPlos={plos}
      canEditStudent={role === "student" || role === "admin"}
      canEditAdvisor={role === "advisor" || role === "admin"}
    />
  );
}
