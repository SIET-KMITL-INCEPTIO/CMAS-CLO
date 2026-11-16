import { z } from "zod"

export const googleLoginSchema = z.object({
  idToken: z.string().min(1),
})

// FR-07: lower-cased here, so every lookup and every stored token agree.
export const emailLinkRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email({ message: "กรอกอีเมลให้ถูกต้อง" })),
})

// 32 random bytes, base64url: 43 characters. Anything else cannot be one of ours.
export const emailLinkVerifySchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, "ลิงก์ไม่ถูกต้อง"),
})

// PATCH /auth/me: the caller's own display name and nothing else (A-8: no role, no status).
export const updateMeSchema = z.object({ name: z.string().trim().min(1).max(100) }).strict()
