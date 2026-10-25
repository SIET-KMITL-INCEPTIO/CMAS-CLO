import { z } from "zod"

export const gradeBandsSchema = z
  .object({
    gradeScale: z.enum(["LETTER", "PASS_FAIL"]).optional(),
    gradeMethod: z.enum(["CRITERION_REFERENCED", "NORM_REFERENCED"]).optional(),
    passCriteria: z.number().min(0).max(100).optional(),
    bands: z
      .array(
        z.object({ grade: z.string().trim().min(1).max(4), minValue: z.number().min(0) }).strict(),
      )
      .min(1)
      .max(20),
  })
  .strict()
export type GradeBandsInput = z.infer<typeof gradeBandsSchema>

// A-10: totalPercent and the derived grade are computed, never sent.
export const overrideSchema = z
  .object({ grade: z.string().trim().min(1).max(4), reason: z.string().trim().min(1).max(500) })
  .strict()

export const studentParamsSchema = z.object({ studentId: z.cuid() })
export const confirmQuerySchema = z.object({ confirm: z.enum(["true", "false"]).optional() })
