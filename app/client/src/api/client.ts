import { toast } from "sonner"
import { API_URL } from "../lib/constants.ts"
import { useAuthStore } from "../store/authStore.ts"
import type { ApiResponse } from "../types/index.ts"

type RequestOptions = Omit<RequestInit, "body"> & { body?: BodyInit | Record<string, unknown> }

async function request<T>(path: string, options: RequestOptions = {}): Promise<T | undefined> {
  const token = useAuthStore.getState().accessToken
  const isFormData = options.body instanceof FormData

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    body: isFormData || options.body === undefined ? (options.body as BodyInit) : JSON.stringify(options.body),
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const json: ApiResponse<T> | null = await res.json().catch(() => null)

  if (!res.ok) {
    const message = json?.message ?? "Request failed"
    toast.error(message)
    throw new Error(message)
  }

  return json?.data
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: BodyInit | Record<string, unknown>) =>
    request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: Record<string, unknown>) =>
    request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
}
