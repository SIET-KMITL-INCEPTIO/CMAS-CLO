import { z } from "zod"

const BLOOM = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"] as const
const SOLO = ["SURFACE", "DEEP", "TRANSFER"] as const

const cloFields = {
  number: z.number().int().min(1).max(99),
  description: z.string().trim().min(1).max(1000),
  weight: z.number().min(0).max(100).nullable(),
  bloomLevel: z.enum(BLOOM),
  levelSource: z.enum(["AUTO", "MANUAL"]),
  soloLevel: z.enum(SOLO),
}

/** O3: AUTO derives SOLO from Bloom, so sending one is a contradiction; MANUAL needs it. */
const soloMatchesSource = (b: { levelSource?: string; soloLevel?: string }) =>
  !(b.levelSource === "AUTO" && b.soloLevel !== undefined)

// bloomLevel has no default on purpose: a wrong level is worse than a missing one (schema).
export const createCloSchema = z
  .object({
    ...cloFields,
    weight: cloFields.weight.optional(),
    levelSource: cloFields.levelSource.default("AUTO"),
    soloLevel: cloFields.soloLevel.optional(),
  })
  .strict()
  .refine(soloMatchesSource, {
    message: "ระดับ AUTO คำนวณ SOLO จาก Bloom ให้เอง ห้ามส่ง soloLevel",
    path: ["soloLevel"],
  })
  .refine((b) => b.levelSource !== "MANUAL" || b.soloLevel !== undefined, {
    message: "ระดับ MANUAL ต้องเลือก soloLevel",
    path: ["soloLevel"],
  })
export type CreateCloInput = z.infer<typeof createCloSchema>

export const updateCloSchema = z
  .object(cloFields)
  .partial()
  .strict()
  .refine((b) => Object.keys(b).length > 0, "ต้องมีอย่างน้อย 1 ฟิลด์")
  .refine(soloMatchesSource, {
    message: "ระดับ AUTO คำนวณ SOLO จาก Bloom ให้เอง ห้ามส่ง soloLevel",
    path: ["soloLevel"],
  })
export type UpdateCloInput = z.infer<typeof updateCloSchema>

const idList = z
  .array(z.cuid())
  .min(1)
  .refine((ids) => new Set(ids).size === ids.length, "มี id ซ้ำ")
export const reorderSchema = z.object({ order: idList }).strict()

const objectiveFields = {
  number: z.number().int().min(1).max(99),
  description: z.string().trim().min(1).max(1000),
  weight: z.number().gt(0).max(100).nullable(),
}
export const createObjectiveSchema = z
  .object({ ...objectiveFields, weight: objectiveFields.weight.optional() })
  .strict()
export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>

export const updateObjectiveSchema = z
  .object(objectiveFields)
  .partial()
  .strict()
  .refine((b) => Object.keys(b).length > 0, "ต้องมีอย่างน้อย 1 ฟิลด์")
export type UpdateObjectiveInput = z.infer<typeof updateObjectiveSchema>

export const cloParamsSchema = z.object({ cloId: z.cuid() })
export const objectiveParamsSchema = z.object({ objectiveId: z.cuid() })
export const confirmQuerySchema = z.object({ confirm: z.enum(["true", "false"]).optional() })
