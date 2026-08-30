import "server-only";
import { callGas } from "./gas-server";
import type { Student } from "./types";

/** For a logged-in student, resolve their own Students row. Redirect-worthy if null upstream. */
export async function getMyStudentId(email: string): Promise<string | null> {
  const students = await callGas<Student[]>("listStudents", email, { filters: {} });
  return students[0]?.StudentId ?? null;
}
