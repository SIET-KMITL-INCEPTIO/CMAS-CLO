import { create } from "zustand"
import type { Me } from "../../types/user.types.ts"

/**
 * The session, in memory only. The access token is never written to
 * localStorage, where any injected script could read it; a reload gets a new
 * one from POST /auth/refresh, whose token is an httpOnly cookie (S-2).
 *
 * `status` drives the route guard: "checking" while the first refresh runs,
 * then "in" or "out".
 */
type AuthState = {
  status: "checking" | "in" | "out"
  me: Me | null
  accessToken: string | null
  setAccessToken: (token: string) => void
  signedIn: (me: Me, token?: string) => void
  signedOut: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: "checking",
  me: null,
  accessToken: null,
  setAccessToken: (accessToken) => set({ accessToken }),
  signedIn: (me, token) => set((s) => ({ me, status: "in", accessToken: token ?? s.accessToken })),
  signedOut: () => set({ me: null, accessToken: null, status: "out" }),
}))

// Sessions before 2026-10-22 kept the token in localStorage under this key.
try {
  localStorage.removeItem("clo-auth")
} catch {
  /* storage blocked: nothing to clean */
}
