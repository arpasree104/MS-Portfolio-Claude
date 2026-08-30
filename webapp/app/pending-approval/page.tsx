import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "./SignOutButton";
import { Clock, ShieldX } from "lucide-react";

export default async function PendingApprovalPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/login");
  if (session.user.status === "active") redirect("/dashboard");

  const disabled = session.user.status === "disabled";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="card w-full max-w-md text-center">
        <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 ${disabled ? "bg-status-red/10 text-status-red" : "bg-status-yellow/10 text-status-yellow-text"}`}>
          {disabled ? <ShieldX size={28} /> : <Clock size={28} />}
        </div>
        <h1 className="text-lg font-bold mb-2">
          {disabled ? "บัญชีถูกระงับการใช้งาน" : "รอการอนุมัติจากผู้ดูแลระบบ"}
        </h1>
        <p className="text-sm text-foreground/60 mb-1">{session.user.email}</p>
        <p className="text-sm text-foreground/60 mb-6">
          {disabled
            ? "บัญชีนี้ถูกระงับการเข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบ"
            : "บัญชีของคุณเข้าสู่ระบบสำเร็จแล้ว แต่ยังไม่ได้รับสิทธิ์การใช้งาน กรุณาติดต่อผู้ดูแลระบบเพื่อขออนุมัติสิทธิ์"}
        </p>
        <SignOutButton />
      </div>
    </div>
  );
}
