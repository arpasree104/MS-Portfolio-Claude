import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import type { AdvisorDashboard, StudentDashboard } from "@/lib/types";
import { StudentDashboardView } from "@/components/dashboard/StudentDashboardView";
import { AdvisorDashboardView } from "@/components/dashboard/AdvisorDashboardView";

export default async function DashboardPage() {
  const session = await requireActiveSession();
  const role = session.user.role;

  const data = await callGas<AdvisorDashboard | StudentDashboard>("getDashboard", session.user.email!, { filters: {} });

  if (role === "student") {
    return <StudentDashboardView data={data as StudentDashboard} />;
  }
  return <AdvisorDashboardView data={data as AdvisorDashboard} />;
}
