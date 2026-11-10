import { apiClient } from "../../lib/apiClient.ts"
import type { LoginResponse } from "./auth.types.ts"

export const authApi = {
  loginWithGoogle: (idToken: string) => apiClient.post<LoginResponse>("/auth/google", { idToken }),

  // Passwordless: the server mails a one-time sign-in link. The endpoint is not on
  // the server yet (D-5; the flow is still to be drawn), so until it ships this answers
  // 404 and apiClient toasts the message. The reply must not reveal whether the
  // address has an account (FR-07), so the screen after it is the same either way.
  requestEmailLink: (email: string) => apiClient.post<null>("/auth/email-link", { email }),

  // The link's token, exchanged once. Same answer as Google: ACTIVE or PENDING.
  verifyEmailLink: (token: string) =>
    apiClient.post<LoginResponse>("/auth/email-link/verify", { token }),
}
