import { z } from "zod"

export const listUsersQuerySchema = z.object({
  status: z.enum(["PENDING", "ACTIVE"]).optional(),
})

export const userIdParamsSchema = z.object({
  id: z.string().min(1),
})
