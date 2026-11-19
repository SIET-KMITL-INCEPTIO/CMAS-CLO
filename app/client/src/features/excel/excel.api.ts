import { apiClient } from "../../lib/apiClient.ts"

/** GET /excel/links — one live connection of the CMAS add-in for Excel. */
export type ExcelLink = {
  id: string
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string
  course: { id: string; code: string; name: string; section: string }
}

export const excelApi = {
  /** The code Excel shows, typed here, for ONE course the caller teaches. */
  approve: ({ userCode, courseId }: { userCode: string; courseId: string }) =>
    apiClient.post<{ approved: true }>(`/courses/${courseId}/excel-links`, { userCode }),
  links: () => apiClient.get<ExcelLink[]>("/excel/links"),
  revoke: (linkId: string) => apiClient.delete<{ revoked: true }>(`/excel/links/${linkId}`),
}
