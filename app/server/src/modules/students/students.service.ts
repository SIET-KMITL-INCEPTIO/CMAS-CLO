import type { Prisma } from "@prisma/client"
import { BusinessRuleError, NotFoundError } from "../../lib/errors.js"
import {
  asText,
  buildWorkbook,
  fileStamp,
  readTable,
  NAME_HEADER,
  STUDENT_CODE_HEADER,
} from "../../lib/excel.js"
import { savePreview, takePreview } from "../../lib/preview-store.js"
import type { StudentRepository } from "./student.repository.js"
import type {
  CreateStudentInput,
  ListStudentsQuery,
  UpdateStudentInput,
} from "./students.validator.js"

const STUDENT_NOT_FOUND = "ไม่พบนักศึกษา"
const PREVIEW_GONE = "ผลตรวจไฟล์หมดอายุหรือไม่ใช่ของรายวิชา/ผู้ใช้นี้ — อัปโหลดไฟล์ใหม่"

type RosterRow = {
  row: number
  studentCode: string
  name: string
  status: "ADD" | "EXISTS" | "ERROR"
  errorCode: string | null
  message: string | null
}
type RosterPreview = {
  fileName: string
  add: { studentCode: string; name: string }[]
  rejects: { row: number; studentCode: string; field: string; value: string; reason: string }[]
}

type DeleteResult = { deleted: true } | { deleted: false; impact: Record<string, number> }

export class StudentService {
  constructor(private readonly students: StudentRepository) {}

  /** Design #45. A withdrawn student stays listed; only the denominators drop them. */
  async list(courseId: string, query: ListStudentsQuery) {
    const [field, dir] = query.sort.split(":") as ["studentCode" | "name", "asc" | "desc"]
    const where: Prisma.StudentWhereInput = {
      courseId,
      ...(query.status !== "ALL" ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { studentCode: { contains: query.q } },
              { name: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    }
    const [{ total, rows }, activityCount] = await Promise.all([
      this.students.list(where, { [field]: dir }, (query.page - 1) * query.perPage, query.perPage),
      this.students.countActivities(courseId),
    ])
    return {
      data: rows.map(({ _count, courseId: _c, ...s }) => ({
        ...s,
        scoredCount: _count.scores,
        activityCount,
      })),
      meta: { total, page: query.page, perPage: query.perPage },
    }
  }

  async create(courseId: string, input: CreateStudentInput) {
    const { courseId: _c, ...s } = await this.students.create(courseId, input)
    return s
  }

  private async single(id: string) {
    const s = await this.students.findById(id)
    if (!s) throw new NotFoundError(STUDENT_NOT_FOUND)
    return s
  }

  /** Design #47: scores hang off the id, so a corrected code keeps them. */
  async update(studentId: string, input: UpdateStudentInput) {
    const { courseId: _c, ...s } = await this.students.update(studentId, input)
    return s
  }

  async remove(studentId: string, confirm: boolean): Promise<DeleteResult> {
    const impact = await this.students.deleteImpact(studentId)
    if ((impact.scores > 0 || impact.grades > 0) && !confirm) return { deleted: false, impact }
    await this.students.delete(studentId)
    return { deleted: true }
  }

  /** R2: out of every denominator; the scores stay so a restore is lossless. */
  async withdraw(studentId: string) {
    const s = await this.single(studentId)
    if (s.status === "WITHDRAWN") throw new BusinessRuleError("นักศึกษาคนนี้ถอนรายวิชาแล้ว")
    if (s.grade) throw new BusinessRuleError("เกรดถูกตรึงแล้ว — ยกเลิกการตรึงเกรดก่อนบันทึกการถอน")
    const today = new Date(new Date().toISOString().slice(0, 10))
    const updated = await this.students.update(studentId, {
      status: "WITHDRAWN",
      withdrawnAt: today,
    })
    return { status: updated.status, withdrawnAt: updated.withdrawnAt }
  }

  async restore(studentId: string) {
    const s = await this.single(studentId)
    if (s.status !== "WITHDRAWN") throw new BusinessRuleError("นักศึกษาคนนี้ยังไม่ได้ถอนรายวิชา")
    const updated = await this.students.update(studentId, { status: "ENROLLED", withdrawnAt: null })
    return { status: updated.status, withdrawnAt: updated.withdrawnAt }
  }

  // ── remediation plans (design #54-#55): free text, never in a formula ──

  private async assertClo(cloId: string, courseId: string) {
    if (!(await this.students.cloInCourse(cloId, courseId))) {
      throw new NotFoundError("ไม่พบ CLO นี้ในรายวิชาของนักศึกษา")
    }
  }

  async savePlan(studentId: string, cloId: string, courseId: string, plan: string, userId: string) {
    await this.assertClo(cloId, courseId)
    const { editor, ...row } = await this.students.upsertPlan(studentId, cloId, plan, userId)
    return { ...row, updatedBy: editor }
  }

  async deletePlan(studentId: string, cloId: string, courseId: string) {
    await this.assertClo(cloId, courseId)
    const { count } = await this.students.deletePlan(studentId, cloId)
    if (count === 0) throw new NotFoundError("ไม่มีแผนของนักศึกษาคนนี้ใน CLO นี้")
    return { deleted: true as const }
  }

  // ── Excel (design #49-#51) ──

  async template(courseId: string) {
    const c = await this.students.courseHeader(courseId)
    const buffer = buildWorkbook([
      {
        name: "รายชื่อ",
        title: "แบบฟอร์มรายชื่อนักศึกษา",
        info: [
          ["รายวิชา", `${c.code} ${c.name}`],
          ["Sec", c.section],
          ["ภาค/ปีการศึกษา", `${c.semester}/${c.year}`],
          ["ผู้สอน", c.instructors.map((i) => i.user.name).join(" · ")],
        ],
        head: [STUDENT_CODE_HEADER, NAME_HEADER],
        rows: [],
      },
    ])
    return { buffer, fileName: `roster-${c.code}-${c.section}-${fileStamp()}.xlsx` }
  }

  /** Design #50: validates every row and writes nothing. An existing code keeps its stored name. */
  async previewImport(courseId: string, userId: string, file: Buffer, fileName: string) {
    const table = readTable(file)
    const existing = new Set(
      (await this.students.codesInCourse(courseId)).map((s) => s.studentCode),
    )
    const seen = new Set<string>()
    const rows: RosterRow[] = []
    const data: RosterPreview = { fileName, add: [], rejects: [] }

    for (const { row, cells } of table.rows) {
      const studentCode = asText(cells[0])
      const name = asText(cells[1])
      const reject = (errorCode: string, field: string, value: string, message: string) => {
        rows.push({ row, studentCode, name, status: "ERROR", errorCode, message })
        data.rejects.push({ row, studentCode, field, value, reason: message })
      }
      if (!studentCode) reject("MISSING_CODE", STUDENT_CODE_HEADER, "", "ไม่ได้กรอกรหัสนักศึกษา")
      else if (studentCode.length > 20)
        reject("CODE_TOO_LONG", STUDENT_CODE_HEADER, studentCode, "รหัสยาวเกิน 20 ตัวอักษร")
      else if (!name) reject("MISSING_NAME", NAME_HEADER, "", "ไม่ได้กรอกชื่อ-นามสกุล")
      else if (seen.has(studentCode))
        reject("DUPLICATE_IN_FILE", STUDENT_CODE_HEADER, studentCode, "รหัสซ้ำกับแถวก่อนหน้าในไฟล์")
      else if (existing.has(studentCode)) {
        rows.push({
          row,
          studentCode,
          name,
          status: "EXISTS",
          errorCode: null,
          message: "มีในรายวิชาแล้ว — ไม่เปลี่ยนชื่อเดิม",
        })
      } else {
        rows.push({ row, studentCode, name, status: "ADD", errorCode: null, message: null })
        data.add.push({ studentCode, name: name.slice(0, 200) })
      }
      if (studentCode) seen.add(studentCode)
    }

    return {
      previewToken: savePreview("ROSTER", courseId, userId, data),
      summary: { total: rows.length, add: data.add.length, failed: data.rejects.length },
      rows,
    }
  }

  async commitImport(courseId: string, userId: string, token: string) {
    const data = takePreview<RosterPreview>("ROSTER", token, courseId, userId)
    if (!data) throw new BusinessRuleError(PREVIEW_GONE)
    return this.students.commitRoster(courseId, userId, data.fileName, data.add, data.rejects)
  }
}
