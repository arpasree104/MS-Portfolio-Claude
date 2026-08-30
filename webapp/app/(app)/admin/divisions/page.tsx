import { redirect } from "next/navigation";
import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import type { Division } from "@/lib/types";
import { DivisionManagementView } from "@/components/admin/DivisionManagementView";

export default async function AdminDivisionsPage() {
  const session = await requireActiveSession();
  if (session.user.role !== "admin") redirect("/dashboard");

  const divisions = await callGas<Division[]>("listAllDivisionsForAdmin", session.user.email!, {});

  return <DivisionManagementView initialDivisions={divisions} />;
}
