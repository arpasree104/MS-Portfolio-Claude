import { redirect } from "next/navigation";
import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import type { AppUser, Division } from "@/lib/types";
import { UserManagementView } from "@/components/admin/UserManagementView";

export default async function AdminUsersPage() {
  const session = await requireActiveSession();
  if (session.user.role !== "admin") redirect("/dashboard");

  const [users, divisions] = await Promise.all([
    callGas<AppUser[]>("listUsers", session.user.email!, {}),
    callGas<Division[]>("listAllDivisionsForAdmin", session.user.email!, {}),
  ]);

  return <UserManagementView initialUsers={users} divisions={divisions} />;
}
