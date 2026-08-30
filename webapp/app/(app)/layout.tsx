import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }
  if (session.user.status !== "active") {
    redirect("/pending-approval");
  }

  return (
    <AppShell role={session.user.role} name={session.user.name || session.user.email}>
      {children}
    </AppShell>
  );
}
