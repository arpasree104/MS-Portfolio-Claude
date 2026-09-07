import { requireActiveSession } from "@/lib/get-session";
import { callGasCached } from "@/lib/gas-server";
import type { EducationHistory, ProfessionalHistory, Student, StudentGoals } from "@/lib/types";
import { StudentInfoForm } from "@/components/profile/StudentInfoForm";

interface ProfileBundle {
  student: Student;
  education: EducationHistory[];
  professional: ProfessionalHistory[];
  goals: StudentGoals[];
}

export default async function StudentInfoTab({ params }: { params: { id: string } }) {
  const session = await requireActiveSession();
  const studentId = params.id;

  // Same action + same payload as the profile layout's getStudentProfile call — React's
  // per-request cache (see callGasCached) means this reuses that result instead of
  // hitting GAS again.
  const bundle = await callGasCached<ProfileBundle>("getStudentProfile", session.user.email!, JSON.stringify({ studentId }));
  const canEdit = session.user.role === "student" || session.user.role === "admin";

  return (
    <StudentInfoForm
      studentId={studentId}
      student={bundle.student}
      education={bundle.education[0] || null}
      professional={bundle.professional[0] || null}
      goals={bundle.goals[0] || null}
      canEdit={canEdit}
    />
  );
}
