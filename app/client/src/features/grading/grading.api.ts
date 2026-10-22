import { apiClient } from "../../lib/apiClient.ts"
import type { BandsBody, Grading } from "./grading.types.ts"

export const gradingApi = {
  /** The ladder, the counts and every student's total and grades — all computed on the server. */
  get: async (courseId: string): Promise<Grading> => {
    const { data, meta } = await apiClient.getWithMeta<Omit<Grading, "meta">>(
      `/courses/${courseId}/grading`,
    )
    return { ...data, meta: meta as Grading["meta"] }
  },
  saveBands: (courseId: string, body: BandsBody) =>
    apiClient.put<unknown>(`/courses/${courseId}/grade-bands`, body),
  run: (courseId: string) =>
    apiClient.post<{ issued: number; skipped: number }>(`/courses/${courseId}/grading/run`),
  /** The server refuses without ?confirm=true: every override goes with the freeze. */
  unfreeze: (courseId: string) =>
    apiClient.delete<{ unfrozen: number }>(`/courses/${courseId}/grading?confirm=true`),
  override: (studentId: string, body: { grade: string; reason: string }) =>
    apiClient.put<unknown>(`/students/${studentId}/grade-override`, body),
  clearOverride: (studentId: string) =>
    apiClient.delete<unknown>(`/students/${studentId}/grade-override`),
  export: (courseId: string) =>
    apiClient.download(`/courses/${courseId}/grades/export`, "grades.xlsx"),
}
