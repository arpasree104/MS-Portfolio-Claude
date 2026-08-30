import { redirect } from "next/navigation";
import { requireActiveSession } from "@/lib/get-session";
import { getMyStudentId } from "@/lib/my-student";

export default async function MyPortfolioPage() {
  const session = await requireActiveSession();
  const studentId = await getMyStudentId(session.user.email!);
  if (!studentId) redirect("/dashboard");
  redirect(`/students/${studentId}/profile/portfolio`);
}
