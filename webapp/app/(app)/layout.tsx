import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }
  if (session.user.status !== "active") {
    redirect("/pending-approval");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={session.user.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar name={session.user.name || session.user.email} role={session.user.role} />
        <main className="flex-1 p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
