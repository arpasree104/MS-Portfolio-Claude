import { redirect } from "next/navigation";
import { requireActiveSession } from "@/lib/get-session";
import { SeedDataView } from "@/components/admin/SeedDataView";

export default async function AdminSeedDataPage() {
  const session = await requireActiveSession();
  if (session.user.role !== "admin") redirect("/dashboard");

  return <SeedDataView />;
}
