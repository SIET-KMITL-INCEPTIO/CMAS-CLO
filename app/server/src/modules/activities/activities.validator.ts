import { z } from "zod"

export const ACTIVITY_TYPES = ["LECTURE", "LAB", "TEST", "PROJECT", "OTHER", "CUSTOM"] as const
export const METHODS = ["QUIZ", "EXAM", "RUBRIC", "WORK", "OBSERVATION", "OTHER", "CUSTOM"] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]
export type Method = (typeof METHODS)[number]

const label = z.string().trim().min(1).max(100)

const activityFields = {
  name: z.string().trim().min(1).max(200),
  type: z.enum(ACTIVITY_TYPES),
  typeLabel: label,
  assessmentMethod: z.enum(METHODS),
  assessmentLabel: label,
  criteriaNote: z.string().max(1000),
  maxScore: z.number().gt(0).max(10000),
  passScore: z.number().min(0),
  weight: z.number().min(0).max(100),
  order: z.number().int().min(0).max(999),
}

/** A CUSTOM choice is named; a built-in one is not (the label would be ignored and drift). */
function labelsMatch(b: {
  type?: string
  typeLabel?: string
  assessmentMethod?: string
  assessmentLabel?: string
}) {
  return (
    (b.typeLabel === undefined || b.type === undefined || b.type === "CUSTOM") &&
    (b.assessmentLabel === undefined ||
      b.assessmentMethod === undefined ||
      b.assessmentMethod === "CUSTOM")
  )
}

// passMark is not a field: it is derived from passScore ÷ maxScore (A-10, M3).
export const createActivitySchema = z
  .object({
    ...activityFields,
    typeLabel: label.optional(),
    assessmentMethod: activityFields.assessmentMethod.optional(),
    assessmentLabel: label.optional(),
    criteriaNote: activityFields.criteriaNote.default(""),
    passScore: activityFields.passScore.optional(),
    weight: activityFields.weight.optional(),
    order: activityFields.order.optional(),
  })
  .strict()
  .refine((b) => b.type !== "CUSTOM" || b.typeLabel !== undefined, {
    message: "ประเภทที่กำหนดเองต้องมีชื่อ (typeLabel)",
    path: ["typeLabel"],
  })
  .refine((b) => b.assessmentMethod !== "CUSTOM" || b.assessmentLabel !== undefined, {
    message: "วิธีประเมินที่กำหนดเองต้องมีชื่อ (assessmentLabel)",
    path: ["assessmentLabel"],
  })
  .refine(labelsMatch, "ชื่อที่กำหนดเองใช้ได้กับตัวเลือก CUSTOM เท่านั้น")
  .refine((b) => b.passScore === undefined || b.passScore <= b.maxScore, {
    message: "คะแนนผ่านต้องไม่เกินคะแนนเต็ม",
    path: ["passScore"],
  })
export type CreateActivityInput = z.infer<typeof createActivitySchema>

export const updateActivitySchema = z
  .object(activityFields)
  .partial()
  .strict()
  .refine((b) => Object.keys(b).length > 0, "ต้องมีอย่างน้อย 1 ฟิลด์")
  .refine(labelsMatch, "ชื่อที่กำหนดเองใช้ได้กับตัวเลือก CUSTOM เท่านั้น")
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>

export const reorderSchema = z
  .object({
    order: z
      .array(z.cuid())
      .min(1)
      .refine((ids) => new Set(ids).size === ids.length, "มี id ซ้ำ"),
  })
  .strict()

export const criteriaSchema = z
  .object({
    cells: z
      .array(
        z
          .object({
            activityId: z.cuid(),
            objectiveId: z.cuid(),
            weight: z.number().gt(0).max(100),
          })
          .strict(),
      )
      .max(5000)
      .refine(
        (cells) =>
          new Set(cells.map((c) => `${c.activityId}|${c.objectiveId}`)).size === cells.length,
        "มีคู่กิจกรรม-จุดประสงค์ซ้ำ",
      ),
  })
  .strict()
export type CriteriaInput = z.infer<typeof criteriaSchema>

export const groupWeightsSchema = z
  .object({
    mode: z.enum(["MANUAL", "GROUP"]),
    // Keys are an activity type, or "CUSTOM:<name>" for a type the instructor named.
    weights: z.record(z.string().min(1).max(110), z.number().min(0).max(100)).optional(),
  })
  .strict()
  .refine((b) => b.mode !== "GROUP" || b.weights !== undefined, {
    message: "โหมดรายกลุ่มต้องส่งน้ำหนักของแต่ละกลุ่ม",
    path: ["weights"],
  })
export type GroupWeightsInput = z.infer<typeof groupWeightsSchema>

export const closeSchema = z
  .object({
    blank: z.enum(["ZERO", "EXCUSED", "LATER"]).default("LATER"),
    reason: z.string().trim().min(1).max(255).optional(),
  })
  .strict()
  .refine((b) => b.blank !== "EXCUSED" || b.reason !== undefined, {
    message: "การยกเว้นต้องมีเหตุผล",
    path: ["reason"],
  })

export const activityParamsSchema = z.object({ activityId: z.cuid() })
export const confirmQuerySchema = z.object({ confirm: z.enum(["true", "false"]).optional() })
