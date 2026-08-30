import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import type { AdvisingLog } from "@/lib/types";
import { AdvisingTabView } from "@/components/profile/AdvisingTabView";

export default async function AdvisingTab({ params }: { params: { id: string } }) {
  const session = await requireActiveSession();
  const studentId = params.id;

  const logs = await callGas<AdvisingLog[]>("listAdvisingLogs", session.user.email!, { studentId });
  const role = session.user.role;

  return (
    <AdvisingTabView
      studentId={studentId}
      initialLogs={logs}
      isAdvisor={role === "advisor" || role === "admin" || role === "executive"}
      isStudent={role === "student"}
    />
  );
}
