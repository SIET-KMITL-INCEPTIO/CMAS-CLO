import { z } from "zod"

const studentFields = {
  studentCode: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(200),
}

// status and withdrawnAt change only through /withdraw and /restore (A-8).
export const createStudentSchema = z.object(studentFields).strict()
export type CreateStudentInput = z.infer<typeof createStudentSchema>

export const updateStudentSchema = z
  .object(studentFields)
  .partial()
  .strict()
  .refine((b) => Object.keys(b).length > 0, "ต้องมีอย่างน้อย 1 ฟิลด์")
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>

export const listStudentsQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    status: z.enum(["ALL", "ENROLLED", "WITHDRAWN"]).default("ALL"),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .enum(["studentCode:asc", "studentCode:desc", "name:asc", "name:desc"])
      .default("studentCode:asc"),
  })
  .strict()
export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>

export const remediationSchema = z.object({ plan: z.string().trim().min(1).max(1000) }).strict()

export const studentParamsSchema = z.object({ studentId: z.cuid() })
export const remediationParamsSchema = z.object({ studentId: z.cuid(), cloId: z.cuid() })
export const commitSchema = z.object({ previewToken: z.string().min(16).max(64) }).strict()
export const confirmQuerySchema = z.object({ confirm: z.enum(["true", "false"]).optional() })
