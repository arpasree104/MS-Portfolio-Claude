import { requireActiveSession } from "@/lib/get-session";
import { callGasCached } from "@/lib/gas-server";
import type { PortfolioItem } from "@/lib/types";
import { PortfolioTabView } from "@/components/profile/PortfolioTabView";

export default async function PortfolioTab({ params }: { params: { id: string } }) {
  const session = await requireActiveSession();
  const studentId = params.id;

  // Same action + payload as the profile layout's listPortfolioItems call — reused via
  // React's per-request cache instead of hitting GAS a second time.
  const items = await callGasCached<PortfolioItem[]>("listPortfolioItems", session.user.email!, JSON.stringify({ studentId }));
  const canEdit = session.user.role === "student" || session.user.role === "admin";

  return <PortfolioTabView studentId={studentId} initialItems={items} canEdit={canEdit} />;
}
