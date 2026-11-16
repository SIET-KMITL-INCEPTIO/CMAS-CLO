import { apiClient } from "../../lib/apiClient.ts"
import type { RosterImportPreview, StudentInput } from "./student.types.ts"

export const studentsApi = {
  create: (courseId: string, body: StudentInput) =>
    apiClient.post<unknown>(`/courses/${courseId}/students`, body),
  update: (studentId: string, body: Partial<StudentInput>) =>
    apiClient.patch<unknown>(`/students/${studentId}`, body),
  /** Without ?confirm=true a student with scores answers 422 with what would go. */
  remove: (studentId: string) =>
    apiClient.delete<{ deleted: true }>(`/students/${studentId}?confirm=true`),
  withdraw: (studentId: string) => apiClient.post(`/students/${studentId}/withdraw`),
  restore: (studentId: string) => apiClient.post(`/students/${studentId}/restore`),
  template: (courseId: string) =>
    apiClient.download(`/courses/${courseId}/students/template`, "roster.xlsx"),
  previewImport: (courseId: string, file: File) =>
    apiClient.upload<RosterImportPreview>(`/courses/${courseId}/students/import/preview`, file),
  commitImport: (courseId: string, previewToken: string) =>
    apiClient.post<unknown>(`/courses/${courseId}/students/import/commit`, { previewToken }),
}
