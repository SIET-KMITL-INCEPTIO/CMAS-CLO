import { z } from "zod"

export const listUsersQuerySchema = z.object({
  status: z.enum(["PENDING", "ACTIVE"]).optional(),
})

export const userIdParamsSchema = z.object({
  id: z.string().min(1),
})

export const userParamsSchema = z.object({ userId: z.string().min(1) })

// The one body that may carry a role (A-8's exception, design #11) — guarded by user.manage.
export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    role: z.enum(["ADMIN", "INSTRUCTOR"]),
  })
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, "ต้องมีอย่างน้อย 1 ฟิลด์")
export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const userStatusSchema = z.object({ isActive: z.boolean() }).strict()

export const AUTH_EVENT_ACTIONS = [
  "CREATE",
  "EDIT",
  "ROLE_SET",
  "SUSPEND",
  "ACTIVATE",
  "PW_RESET",
  "PW_CHANGE",
  "DENY",
  "REGISTER",
  "VERIFY",
  "LOGIN",
  "LOGIN_GOOGLE",
  "LOGOUT",
] as const

export const authEventsQuerySchema = z
  .object({
    action: z.enum(AUTH_EVENT_ACTIONS).optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()

// G1: who can be put on a course — searched by name or email, a short list only.
export const instructorSearchSchema = z
  .object({
    q: z.string().trim().min(1).max(100),
    limit: z.coerce.number().int().min(1).max(10).default(8),
  })
  .strict()
