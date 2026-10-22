import { z } from "zod"

export const studentParamsSchema = z.object({ courseId: z.cuid(), studentId: z.cuid() })

export const scoresExportQuerySchema = z
  .object({ type: z.enum(["raw", "clo", "both"]).default("both") })
  .strict()

export const dashboardExportQuerySchema = z
  .object({
    scope: z.enum(["course", "student"]).default("course"),
    studentId: z.cuid().optional(),
    format: z.literal("xlsx").default("xlsx"), // PDF is after v1
  })
  .strict()
  .refine((q) => q.scope !== "student" || q.studentId !== undefined, {
    message: "scope=student ต้องระบุ studentId",
    path: ["studentId"],
  })
