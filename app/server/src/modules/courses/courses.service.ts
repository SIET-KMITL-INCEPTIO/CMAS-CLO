import type { Prisma } from "@prisma/client"
import { BusinessRuleError, NotFoundError } from "../../lib/errors.js"
import {
  defaultBands,
  lowestPassingMin,
  takesPassCriteria,
  type GradeScale,
  type GradingMethod,
} from "../../lib/grade-ladder.js"
import {
  canSeeCourse,
  CourseNotFoundError,
  type Caller,
} from "../authorization/authorization.service.js"
import type { CourseRepository, CourseRow } from "./course.repository.js"
import type { CreateCourseInput, ListCoursesQuery, UpdateCourseInput } from "./courses.validator.js"

const ACCOUNT_UNUSABLE = "บัญชีนี้ยังใช้งานไม่ได้"

/** The response shape of one course (A-9). Decimals go out as "3.0", as the faculty prints them. */
export function toCourseDto(row: CourseRow) {
  const { _count, instructors, credits, lectureHours, practiceHours, selfStudyHours, ...rest } = row
  return {
    ...rest,
    credits: credits.toFixed(1),
    lectureHours: lectureHours.toFixed(1),
    practiceHours: practiceHours.toFixed(1),
    selfStudyHours: selfStudyHours.toFixed(1),
    counts: _count,
    instructors: instructors.map((i) => ({ userId: i.userId, name: i.user.name })),
  }
}

/**
 * The 422 rules that depend on more than one field (design #16, #18). Checked
 * on the merged value for a PATCH, so sending only gradeMethod is judged
 * against the stored gradeScale.
 */
function checkGradingRules(scale: GradeScale, method: GradingMethod, passCriteriaSent: boolean) {
  if (scale === "PASS_FAIL" && method === "NORM_REFERENCED") {
    throw new BusinessRuleError("รายวิชาแบบผ่าน/ไม่ผ่าน ตัดเกรดอิงกลุ่มไม่ได้")
  }
  if (passCriteriaSent && !takesPassCriteria(scale, method)) {
    throw new BusinessRuleError(
      "รายวิชา A–F อิงเกณฑ์ใช้ขอบล่างของเกรด D เป็นเกณฑ์ผ่าน — แก้ที่ขั้นบันไดเกรดแทน",
    )
  }
}

export class CourseService {
  constructor(private readonly courses: CourseRepository) {}

  async list(query: ListCoursesQuery, caller: Caller) {
    const [field, dir] = query.sort.split(":") as [string, "asc" | "desc"]
    const where: Prisma.CourseWhereInput = {
      ...this.courses.visibleTo(caller),
      ...(query.year ? { year: query.year } : {}),
      ...(query.semester ? { semester: query.semester } : {}),
      ...(query.q
        ? {
            OR: [
              { code: { contains: query.q, mode: "insensitive" } },
              { name: { contains: query.q, mode: "insensitive" } },
              { nameEn: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    }
    const { total, rows } = await this.courses.list(
      where,
      { [field]: dir },
      (query.page - 1) * query.perPage,
      query.perPage,
    )
    return {
      data: rows.map(toCourseDto),
      meta: { total, page: query.page, perPage: query.perPage },
    }
  }

  async get(courseId: string) {
    const row = await this.courses.findById(courseId)
    if (!row) throw new CourseNotFoundError()
    return toCourseDto(row)
  }

  /**
   * Accounts may teach only while ACTIVE, approved and INSTRUCTOR (D-1). One
   * message for every reason, and no id or email in it, so the endpoint is
   * not an oracle for which accounts exist.
   */
  private async assertAssignable(userIds: string[]) {
    const users = await this.courses.findUsers(userIds)
    const ok = users.filter((u) => u.role === "INSTRUCTOR" && u.isActive && u.status === "ACTIVE")
    if (ok.length !== userIds.length) throw new BusinessRuleError(ACCOUNT_UNUSABLE)
  }

  async create(input: CreateCourseInput, caller: Caller) {
    const { instructors, passCriteria, ...fields } = input
    checkGradingRules(fields.gradeScale, fields.gradeMethod, passCriteria !== undefined)

    // FR-22c: an instructor who creates a course teaches it. ADMIN does not teach (D-1),
    // so a course it opens must name someone who does (FR-23).
    const ids = new Set(instructors.map((i) => i.userId))
    if (caller.role === "INSTRUCTOR") ids.add(caller.userId)
    if (ids.size === 0) throw new BusinessRuleError("ต้องระบุผู้สอนอย่างน้อย 1 คน")
    await this.assertAssignable([...ids])

    const pass = takesPassCriteria(fields.gradeScale, fields.gradeMethod) ? (passCriteria ?? 60) : 0
    const bands = defaultBands(fields.gradeScale, fields.gradeMethod, pass)
    const row = await this.courses.create(
      {
        ...fields,
        passCriteria: takesPassCriteria(fields.gradeScale, fields.gradeMethod)
          ? pass
          : lowestPassingMin(bands),
      },
      [...ids],
      bands,
    )
    return { ...toCourseDto(row), gradeBands: bands }
  }

  async update(courseId: string, input: UpdateCourseInput) {
    const current = await this.courses.findById(courseId)
    if (!current) throw new CourseNotFoundError()

    const scale = input.gradeScale ?? current.gradeScale
    const method = input.gradeMethod ?? current.gradeMethod
    checkGradingRules(scale, method, input.passCriteria !== undefined)

    const ladderChanged = scale !== current.gradeScale || method !== current.gradeMethod
    let bands = null
    const data: UpdateCourseInput = { ...input }
    if (ladderChanged) {
      // A frozen grade was awarded on the old ladder; switching under it would orphan it.
      if ((await this.courses.countFrozenGrades(courseId)) > 0) {
        throw new BusinessRuleError(
          "มีเกรดที่ตรึงไว้แล้ว — ยกเลิกการตรึงเกรดในหน้าการตัดเกรดก่อน จึงเปลี่ยนรูปแบบเกรดได้",
        )
      }
      const pass = takesPassCriteria(scale, method)
        ? (input.passCriteria ?? current.passCriteria)
        : 0
      bands = defaultBands(scale, method, pass)
      data.passCriteria = takesPassCriteria(scale, method) ? pass : lowestPassingMin(bands)
    }

    const row = await this.courses.update(courseId, data, bands)
    if (!ladderChanged && scale === "PASS_FAIL" && input.passCriteria !== undefined) {
      await this.courses.setPassBand(courseId, input.passCriteria) // CR-06
    }
    return toCourseDto(row)
  }

  impact(courseId: string) {
    return this.courses.impact(courseId)
  }

  /** FR-26: without confirm nothing is deleted; the caller gets the impact to show. */
  async remove(courseId: string, confirm: boolean) {
    if (!confirm) return { deleted: false as const, impact: await this.courses.impact(courseId) }
    await this.courses.delete(courseId)
    return { deleted: true as const }
  }

  async instructors(courseId: string) {
    const rows = await this.courses.listInstructors(courseId)
    return rows.map((r) => ({
      userId: r.userId,
      name: r.user.name,
      email: r.user.email,
      assignedAt: r.assignedAt,
    }))
  }

  async addInstructor(courseId: string, userId: string) {
    await this.assertAssignable([userId])
    await this.courses.addInstructor(courseId, userId)
    return this.instructors(courseId)
  }

  async removeInstructor(courseId: string, userId: string, caller: Caller) {
    // S-9 / SEC-4: nobody edits their own row — handing a course away is someone else's call.
    if (userId === caller.userId) {
      throw new BusinessRuleError("เอาตัวเองออกจากรายวิชาไม่ได้ — ให้ผู้สอนคนอื่นหรือผู้ดูแลระบบทำ")
    }
    const result = await this.courses.removeInstructor(courseId, userId)
    if (result === "missing") throw new NotFoundError("ไม่พบผู้สอนคนนี้ในรายวิชา")
    if (result === "last") throw new BusinessRuleError("รายวิชาต้องมีผู้สอนอย่างน้อย 1 คน")
    return { removed: true as const }
  }

  /**
   * course.create is a system capability, so the access hook did not look at
   * :courseId — the visibility check happens here (design #24), with the same
   * 404 a foreign course gets everywhere else.
   */
  async duplicate(courseId: string, caller: Caller) {
    if (!(await canSeeCourse(courseId, caller))) throw new CourseNotFoundError()
    const tree = await this.courses.findTree(courseId)
    if (!tree) throw new CourseNotFoundError()

    const used = new Set(
      (await this.courses.sectionsInUse(tree.code, tree.semester, tree.year)).map((c) => c.section),
    )
    let next = Number(tree.section)
    do next++
    while (used.has(String(next).padStart(2, "0")) && next <= 99)
    if (next > 99) throw new BusinessRuleError("รายวิชานี้มี Sec ครบ 99 แล้วในภาคเรียนนี้")

    // The original's instructors who can still teach, plus the caller (P17).
    const original = await this.courses.findUsers(tree.instructors.map((i) => i.userId))
    const ids = new Set(
      original
        .filter((u) => u.role === "INSTRUCTOR" && u.isActive && u.status === "ACTIVE")
        .map((u) => u.id),
    )
    if (caller.role === "INSTRUCTOR") ids.add(caller.userId)
    if (ids.size === 0)
      throw new BusinessRuleError("ต้นทางไม่มีผู้สอนที่ใช้งานได้ — เพิ่มผู้สอนก่อนคัดลอก")

    return toCourseDto(await this.courses.duplicate(tree, String(next).padStart(2, "0"), [...ids]))
  }
}
