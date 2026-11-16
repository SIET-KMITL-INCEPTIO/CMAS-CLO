import { z } from "zod"

export const googleLoginSchema = z.object({
  idToken: z.string().min(1),
})

// PATCH /auth/me: the caller's own display name and nothing else (A-8: no role, no status).
export const updateMeSchema = z.object({ name: z.string().trim().min(1).max(100) }).strict()
