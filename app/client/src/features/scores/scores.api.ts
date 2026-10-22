import { apiClient } from "../../lib/apiClient.ts"
import type {
  CellWrite,
  CloseBlank,
  Grid,
  GridActivity,
  GridMeta,
  GridStudent,
  WriteSource,
} from "./score.types.ts"

export type ScoreImportPreview = {
  previewToken: string
  fileName: string
  summary: { total: number; ok: number; failed: number }
  columns: { header: string; activityId: string | null; matched: boolean }[]
  rows: {
    row: number
    studentCode: string
    status: "OK" | "ERROR"
    values: Record<string, number | "EXCUSED">
    errorCode: string | null
    message: string | null
  }[]
}

export const scoresApi = {
  /** 200 per page is the server's ceiling; one Sec almost always fits. */
  grid: async (courseId: string, page: number): Promise<Grid> => {
    const query = new URLSearchParams({ perPage: "200", page: String(page) })
    const { data, meta } = await apiClient.getWithMeta<{
      activities: GridActivity[]
      students: GridStudent[]
    }>(`/courses/${courseId}/scores?${query}`)
    return { ...data, meta: meta as GridMeta }
  },
  put: (courseId: string, scores: CellWrite[], source: WriteSource) =>
    apiClient.put<{ written: number; unchanged: number }>(`/courses/${courseId}/scores`, {
      scores,
      source,
    }),
  close: (activityId: string, body: { blank: CloseBlank; reason?: string }) =>
    apiClient.post(`/activities/${activityId}/close`, body),
  reopen: (activityId: string) => apiClient.post(`/activities/${activityId}/reopen`),
  template: (courseId: string) =>
    apiClient.download(`/courses/${courseId}/scores/template`, "scores.xlsx"),
  previewImport: (courseId: string, file: File) =>
    apiClient.upload<ScoreImportPreview>(`/courses/${courseId}/scores/import/preview`, file),
  commitImport: (courseId: string, previewToken: string) =>
    apiClient.post<unknown>(`/courses/${courseId}/scores/import/commit`, { previewToken }),
}
