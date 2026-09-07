import "server-only";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";

/** Use in Server Components/pages that require an active, authenticated session. */
export async function requireActiveSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");
  if (session.user.status === "awaiting_profile") redirect("/complete-profile");
  if (session.user.status !== "active") redirect("/pending-approval");
  return session;
}
