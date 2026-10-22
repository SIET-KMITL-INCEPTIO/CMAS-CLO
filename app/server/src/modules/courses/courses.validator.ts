import { z } from "zod"

/** Hours and credits are printed "3 (2-2-5)" — one decimal place at most (Decimal(3,1)/(4,1)). */
const oneDecimal = (max: number) =>
  z
    .number()
    .min(0)
    .max(max)
    .refine((n) => Math.round(n * 10) === n * 10, "ทศนิยมได้ 1 ตำแหน่ง")

const percent = z.number().min(0).max(100)
const cuid = z.cuid()

const courseFields = {
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().max(200).nullable().optional(),
  semester: z.number().int().min(1).max(3),
  year: z.number().int().min(2500).max(2600), // พ.ศ.
  section: z
    .string()
    .regex(/^\d{2}$/, "Sec เป็นตัวเลข 2 หลัก เช่น 01")
    .refine((s) => s !== "00", "Sec เริ่มที่ 01"),
  credits: oneDecimal(30),
  lectureHours: oneDecimal(999),
  practiceHours: oneDecimal(999),
  selfStudyHours: oneDecimal(999),
  gradeScale: z.enum(["LETTER", "PASS_FAIL"]),
  gradeMethod: z.enum(["CRITERION_REFERENCED", "NORM_REFERENCED"]),
  passCriteria: percent,
  cloPassMark: percent,
  classTarget: percent,
}

// A-8: courseId, createdBy and the like never come from a body — .strict() refuses them.
export const createCourseSchema = z
  .object({
    ...courseFields,
    section: courseFields.section.default("01"),
    credits: courseFields.credits.default(3),
    lectureHours: courseFields.lectureHours.default(0),
    practiceHours: courseFields.practiceHours.default(0),
    selfStudyHours: courseFields.selfStudyHours.default(0),
    gradeScale: courseFields.gradeScale.default("LETTER"),
    gradeMethod: courseFields.gradeMethod.default("CRITERION_REFERENCED"),
    passCriteria: percent.optional(),
    cloPassMark: percent.default(60),
    classTarget: percent.default(100),
    instructors: z
      .array(z.object({ userId: cuid }).strict())
      .max(20)
      .refine((xs) => new Set(xs.map((x) => x.userId)).size === xs.length, "ผู้สอนซ้ำกัน")
      .default([]),
  })
  .strict()
export type CreateCourseInput = z.infer<typeof createCourseSchema>

export const updateCourseSchema = z
  .object(courseFields)
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, "ต้องมีอย่างน้อย 1 ฟิลด์")
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>

const SORT_FIELDS = ["code", "name", "year", "semester", "createdAt"] as const
export const listCoursesQuerySchema = z
  .object({
    year: z.coerce.number().int().min(2500).max(2600).optional(),
    semester: z.coerce.number().int().min(1).max(3).optional(),
    q: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .string()
      .regex(new RegExp(`^(${SORT_FIELDS.join("|")}):(asc|desc)$`))
      .default("code:asc"),
  })
  .strict()
export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>

export const courseParamsSchema = z.object({ courseId: cuid })
export const instructorParamsSchema = z.object({ courseId: cuid, userId: z.string().min(1) })
export const addInstructorSchema = z.object({ userId: cuid }).strict()

/** ?confirm=true on DELETE (FR-26). Anything else means "show me the impact first". */
export const confirmQuerySchema = z.object({ confirm: z.enum(["true", "false"]).optional() })
