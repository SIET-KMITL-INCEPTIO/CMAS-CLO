import { z } from "zod"

/** A cell as the grid sends it: a score, "EXCUSED", or null for empty (FR-62: never 0). */
const cellValue = z.union([z.number().min(0), z.literal("EXCUSED"), z.null()])

export const putScoresSchema = z
  .object({
    scores: z
      .array(
        z
          .object({
            studentId: z.cuid(),
            activityId: z.cuid(),
            score: cellValue,
            reason: z.string().trim().min(1).max(255).optional(),
            // D-3: what the client last saw; a different value in the database is a 409.
            from: cellValue,
          })
          .strict(),
      )
      .min(1)
      .max(2000)
      .refine(
        (cells) =>
          new Set(cells.map((c) => `${c.studentId}|${c.activityId}`)).size === cells.length,
        "มีช่องเดียวกันซ้ำในคำขอ",
      ),
    source: z.enum(["MANUAL", "PASTE", "FILL", "FILL_UNDO", "UNDO"]).default("MANUAL"),
  })
  .strict()
export type PutScoresInput = z.infer<typeof putScoresSchema>

export const scoresQuerySchema = z
  .object({
    status: z.enum(["ALL", "ENROLLED"]).default("ALL"),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(200).default(50),
  })
  .strict()

export const uploadsQuerySchema = z
  .object({
    // The design names the score kind SCORES; the column stores SCORE.
    kind: z.enum(["SCORES", "SCORE", "ROSTER"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()

export const uploadErrorsQuerySchema = z
  .object({ format: z.enum(["json", "xlsx"]).default("json") })
  .strict()

export const scoreChangesQuerySchema = z
  .object({
    studentId: z.cuid().optional(),
    activityId: z.cuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()

export const uploadParamsSchema = z.object({ uploadId: z.cuid() })
export const commitSchema = z.object({ previewToken: z.string().min(16).max(64) }).strict()
