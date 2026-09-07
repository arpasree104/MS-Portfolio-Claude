import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "../pending-approval/SignOutButton";
import { CompleteProfileForm } from "./CompleteProfileForm";
import { UserCheck } from "lucide-react";

export default async function CompleteProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/login");
  if (session.user.status === "active") redirect("/dashboard");
  if (session.user.status !== "awaiting_profile") redirect("/pending-approval");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="card w-full max-w-2xl text-center">
        <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary-50 text-primary">
          <UserCheck size={28} />
        </div>
        <h1 className="text-lg font-bold mb-2">กรอกข้อมูลโปรไฟล์เพื่อเริ่มใช้งาน</h1>
        <p className="text-sm text-foreground/60 mb-1">{session.user.email}</p>
        <p className="text-sm text-foreground/60 mb-6">
          ไม่พบข้อมูลของคุณในทะเบียนนักศึกษา กรุณากรอกข้อมูลเบื้องต้นด้านล่างเพื่อสร้างโปรไฟล์และเข้าใช้งานทันที
        </p>

        <CompleteProfileForm />

        <div className="mt-6 pt-6 border-t border-black/10">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
