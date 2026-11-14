import { apiClient } from "../../lib/apiClient.ts"
import type {
  AtRisk,
  AtRiskRow,
  Attainment,
  ClassResultRow,
  CourseSummary,
  StudentResult,
} from "./dashboard.types.ts"

// Every number here is computed by the server's one analysis (FR-88); the
// screens only lay it out.
export const dashboardApi = {
  attainment: async (courseId: string): Promise<Attainment> => {
    const { data, meta } = await apiClient.getWithMeta<Omit<Attainment, "meta">>(
      `/courses/${courseId}/dashboard/attainment`,
    )
    return { ...data, meta: meta as Attainment["meta"] }
  },
  atRisk: async (courseId: string): Promise<AtRisk> => {
    const { data, meta } = await apiClient.getWithMeta<AtRiskRow[]>(
      `/courses/${courseId}/dashboard/at-risk`,
    )
    return { rows: data, meta: meta as AtRisk["meta"] }
  },
  summary: (courseId: string) =>
    apiClient.get<CourseSummary>(`/courses/${courseId}/dashboard/summary`),
  classResults: (courseId: string) =>
    apiClient.get<ClassResultRow[]>(`/courses/${courseId}/dashboard/students`),
  student: (courseId: string, studentId: string) =>
    apiClient.get<StudentResult>(`/courses/${courseId}/dashboard/students/${studentId}`),
  export: (courseId: string) =>
    apiClient.download(`/courses/${courseId}/dashboard/export`, "results.xlsx"),
}
