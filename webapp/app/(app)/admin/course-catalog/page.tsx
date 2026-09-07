import { redirect } from "next/navigation";
import { requireActiveSession } from "@/lib/get-session";
import { callGas } from "@/lib/gas-server";
import type { CourseCatalogItem } from "@/lib/types";
import { CourseCatalogManagementView } from "@/components/admin/CourseCatalogManagementView";

export default async function AdminCourseCatalogPage() {
  const session = await requireActiveSession();
  if (session.user.role !== "admin") redirect("/dashboard");

  const courses = await callGas<CourseCatalogItem[]>("listAllCourseCatalogForAdmin", session.user.email!, {});

  return <CourseCatalogManagementView initialCourses={courses} />;
}
