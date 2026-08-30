import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginButton } from "./LoginButton";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    redirect(session.user.status === "active" ? "/dashboard" : "/pending-approval");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="card w-full max-w-md text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mx-auto mb-4">
          TU
        </div>
        <h1 className="text-xl font-bold text-primary mb-1">M.N.S. Portfolio</h1>
        <p className="text-sm text-foreground/60 mb-6">
          แฟ้มสะสมผลงานและระบบติดตามความก้าวหน้านักศึกษา
          <br />
          คณะพยาบาลศาสตร์ มหาวิทยาลัยธรรมศาสตร์
        </p>
        <LoginButton />
      </div>
    </div>
  );
}
