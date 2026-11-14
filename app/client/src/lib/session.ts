/**
 * Starting and ending a session. A reload has no token in memory, so it asks
 * POST /auth/refresh (the httpOnly cookie) for one, then reads the live
 * account from GET /auth/me — never from anything the browser stored.
 */
import type { QueryClient } from "@tanstack/react-query"
import { apiClient, refreshSession } from "./apiClient.ts"
import { useAuthStore } from "../features/auth/useAuthStore.ts"
import type { Me } from "../types/user.types.ts"

let resuming: Promise<void> | null = null

/** One run at a time: StrictMode mounts twice in dev and would read /auth/me twice. */
export function resumeSession(): Promise<void> {
  resuming ??= (async () => {
    const store = useAuthStore.getState()
    if (!(await refreshSession())) return store.signedOut()
    try {
      store.signedIn(await apiClient.get<Me>("/auth/me"))
    } catch {
      store.signedOut()
    }
  })().finally(() => {
    resuming = null
  })
  return resuming
}

/** After POST /auth/google returned a token. */
export async function startSession(accessToken: string) {
  const store = useAuthStore.getState()
  store.setAccessToken(accessToken)
  store.signedIn(await apiClient.get<Me>("/auth/me"), accessToken)
}

/** Revokes the refresh token server-side; the access token simply runs out (15 min). */
export async function endSession(queryClient: QueryClient) {
  await apiClient.post("/auth/logout").catch(() => undefined)
  useAuthStore.getState().signedOut()
  queryClient.clear()
}
