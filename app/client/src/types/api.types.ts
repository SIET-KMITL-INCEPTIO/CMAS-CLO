/** The server's response envelope (lib/response.ts on the server). */
export type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
  errors?: unknown
  meta?: Record<string, unknown>
}

/** `meta` of a paged list. */
export type PageMeta = { total: number; page: number; perPage: number }
