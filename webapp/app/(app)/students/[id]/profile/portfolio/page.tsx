import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import type { PortfolioItem } from "@/lib/types";
import { PortfolioTabView } from "@/components/profile/PortfolioTabView";

export default async function PortfolioTab({ params }: { params: { id: string } }) {
  const session = await requireActiveSession();
  const studentId = params.id;

  const items = await callGas<PortfolioItem[]>("listPortfolioItems", session.user.email!, { studentId });
  const canEdit = session.user.role === "student" || session.user.role === "admin";

  return <PortfolioTabView studentId={studentId} initialItems={items} canEdit={canEdit} />;
}
