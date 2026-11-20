import { apiClient } from "../../lib/apiClient.ts"

/** GET /excel/links — one live connection of the CMAS add-in for Excel. */
export type ExcelLink = {
  id: string
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string
  course: { id: string; code: string; name: string; section: string }
}

/** GET /excel/addin — the add-in release. sha256 is null until a build has been published. */
export type AddinRelease = { version: string; sha256: string | null; platforms: string[] }

export const excelApi = {
  release: () => apiClient.get<AddinRelease>("/excel/addin"),
  /** The add-in file itself; needs a web sign-in, so it is fetched, not linked. */
  downloadAddin: () => apiClient.download("/excel/addin/file", "CMAS.xlam"),
  /** The code Excel shows, typed here, for ONE course the caller teaches. */
  approve: ({ userCode, courseId }: { userCode: string; courseId: string }) =>
    apiClient.post<{ approved: true }>(`/courses/${courseId}/excel-links`, { userCode }),
  links: () => apiClient.get<ExcelLink[]>("/excel/links"),
  revoke: (linkId: string) => apiClient.delete<{ revoked: true }>(`/excel/links/${linkId}`),
}
