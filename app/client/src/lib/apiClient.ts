/**
 * The one way the client talks to the API (features/README.md: page → hook →
 * xxx.api.ts → here).
 *
 * - Every response is the server's envelope; callers get `data`, or
 *   `{ data, meta }` when they need paging or warnings.
 * - A failed call throws ApiError with the status, the Thai message and the
 *   `errors` detail, and shows nothing itself: a 422 belongs under its field,
 *   a 409 on the cells that collided. Unhandled errors are toasted once, by the
 *   QueryClient in main.tsx.
 * - The access token lives in memory only. On a 401 the client asks
 *   POST /auth/refresh once (the refresh token is an httpOnly cookie, S-2) and
 *   retries; every request that 401s meanwhile waits for that same refresh.
 */
import { API_URL } from "./app.constants.ts"
import { useAuthStore } from "../features/auth/useAuthStore.ts"

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export type Envelope<T> = { data: T; meta?: Record<string, unknown> }
type Body = BodyInit | object | undefined
type Options = { method?: string; body?: Body; retried?: boolean }

let refreshing: Promise<boolean> | null = null

/** Single-flight: ten requests that 401 together cause one refresh. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" })
      if (!res.ok) return false
      const json = (await res.json()) as { data?: { accessToken?: string } }
      const token = json.data?.accessToken
      if (!token) return false
      useAuthStore.getState().setAccessToken(token)
      return true
    } catch {
      return false
    } finally {
      // Let the next expiry, fifteen minutes on, start a new refresh.
      setTimeout(() => (refreshing = null), 0)
    }
  })()
  return refreshing
}

const isBodyInit = (b: Body): b is BodyInit =>
  b instanceof FormData || b instanceof Blob || typeof b === "string"

async function send(path: string, { method = "GET", body, retried }: Options): Promise<Response> {
  const token = useAuthStore.getState().accessToken
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined && !isBodyInit(body)) headers["Content-Type"] = "application/json"

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers,
    body: body === undefined ? undefined : isBodyInit(body) ? body : JSON.stringify(body),
  })

  // The sign-in routes answer 401 for a bad credential; that is not an expired session.
  if (res.status === 401 && !retried && !path.startsWith("/auth/")) {
    if (await refreshSession()) return send(path, { method, body, retried: true })
    useAuthStore.getState().signedOut()
  }
  return res
}

async function envelope<T>(path: string, options: Options = {}): Promise<Envelope<T>> {
  const res = await send(path, options)
  const json = (await res.json().catch(() => null)) as {
    data?: T
    meta?: Record<string, unknown>
    message?: string
    errors?: unknown
  } | null
  if (!res.ok) {
    throw new ApiError(res.status, json?.message ?? "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง", json?.errors)
  }
  return { data: json?.data as T, meta: json?.meta }
}

/** "export.xlsx" from `filename*=UTF-8''…` first (the Thai name), else `filename="…"`. */
function fileNameOf(res: Response, fallback: string) {
  const cd = res.headers.get("Content-Disposition") ?? ""
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cd)?.[1]
  if (utf8) return decodeURIComponent(utf8)
  return /filename="([^"]+)"/i.exec(cd)?.[1] ?? fallback
}

export const apiClient = {
  get: <T>(path: string) => envelope<T>(path).then((r) => r.data),
  /** For lists with paging or writes that return warnings in `meta`. */
  getWithMeta: <T>(path: string) => envelope<T>(path),
  post: <T>(path: string, body?: Body) =>
    envelope<T>(path, { method: "POST", body }).then((r) => r.data),
  postWithMeta: <T>(path: string, body?: Body) => envelope<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: Body) =>
    envelope<T>(path, { method: "PUT", body }).then((r) => r.data),
  patch: <T>(path: string, body?: Body) =>
    envelope<T>(path, { method: "PATCH", body }).then((r) => r.data),
  delete: <T>(path: string) => envelope<T>(path, { method: "DELETE" }).then((r) => r.data),

  /** An Excel export or template: saved with the server's file name. */
  async download(path: string, fallbackName = "download.xlsx") {
    const res = await send(path, {})
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { message?: string } | null
      throw new ApiError(res.status, json?.message ?? "ดาวน์โหลดไม่สำเร็จ")
    }
    const url = URL.createObjectURL(await res.blob())
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: fileNameOf(res, fallbackName),
    })
    a.click()
    URL.revokeObjectURL(url)
  },

  /** An Excel upload: one multipart field named "file" (S-6). */
  upload: <T>(path: string, file: File) => {
    const form = new FormData()
    form.append("file", file)
    return envelope<T>(path, { method: "POST", body: form }).then((r) => r.data)
  },
}
