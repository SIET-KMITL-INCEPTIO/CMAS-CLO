import { BusinessRuleError, ConflictError } from "../../lib/errors.js"
import {
  activityHeader,
  asText,
  buildWorkbook,
  fileStamp,
  readTable,
  NAME_HEADER,
  STUDENT_CODE_HEADER,
} from "../../lib/excel.js"
import { savePreview, takePreview } from "../../lib/preview-store.js"
import type { IncomingCell, ScoreRepository } from "./score.repository.js"
import { cellOf, type CellValue } from "./score-writer.js"
import type { PutScoresInput } from "./scores.validator.js"

/** What the grid shows for a cell: a number, "EXCUSED", or null = not assessed yet (FR-62). */
type GridValue = number | "EXCUSED" | null
const toGrid = (v: CellValue | null): GridValue =>
  v === null ? null : v.excused ? "EXCUSED" : v.score
const fromGrid = (v: GridValue, reason?: string | null): CellValue | null =>
  v === null
    ? null
    : v === "EXCUSED"
      ? { excused: true, reason: reason ?? null }
      : { score: v, excused: false }

/** The word an instructor types in a cell to excuse it. */
const EXCUSED_WORDS = new Set(["ยกเว้น", "EXCUSED", "excused"])
const PREVIEW_GONE = "ผลตรวจไฟล์หมดอายุหรือไม่ใช่ของรายวิชา/ผู้ใช้นี้ — อัปโหลดไฟล์ใหม่"

type ScorePreview = {
  fileName: string
  cells: { studentId: string; activityId: string; to: CellValue }[]
  okRows: number
  failedRows: number
  rejects: { row: number; studentCode: string; field: string; value: string; reason: string }[]
}

export class ScoreService {
  constructor(private readonly scores: ScoreRepository) {}

  /** Design #56. */
  async grid(
    courseId: string,
    query: { status: "ALL" | "ENROLLED"; page: number; perPage: number },
  ) {
    const { activities, total, students, progress, enrolled } = await this.scores.grid(
      courseId,
      query.status === "ENROLLED",
      (query.page - 1) * query.perPage,
      query.perPage,
    )
    const scoredBy = new Map(
      progress.map((p) => [p.activityId, (p._count as { _all: number })._all]),
    )
    return {
      data: {
        activities: activities.map((a) => ({
          id: a.id,
          name: a.name,
          maxScore: a.maxScore,
          passScore: a.passScore ?? (a.passMark * a.maxScore) / 100,
          closedAt: a.closedAt,
        })),
        students: students.map((s) => ({
          id: s.id,
          studentCode: s.studentCode,
          name: s.name,
          status: s.status,
          scores: Object.fromEntries(s.scores.map((r) => [r.activityId, toGrid(cellOf(r))])),
        })),
      },
      meta: {
        total,
        page: query.page,
        perPage: query.perPage,
        progress: Object.fromEntries(
          activities.map((a) => [a.id, { scored: scoredBy.get(a.id) ?? 0, total: enrolled }]),
        ),
      },
    }
  }

  /**
   * Design #57 · FR-63: all or nothing. Every reason a cell is refused is
   * collected first and returned together (422), so one round trip shows the
   * instructor every cell to fix; a cell someone else changed meanwhile is a 409.
   */
  async put(courseId: string, input: PutScoresInput, userId: string) {
    const studentIds = [...new Set(input.scores.map((c) => c.studentId))]
    const activityIds = [...new Set(input.scores.map((c) => c.activityId))]
    const { students, activities } = await this.scores.context(courseId, studentIds, activityIds)
    const student = new Map(students.map((s) => [s.id, s]))
    const activity = new Map(activities.map((a) => [a.id, a]))

    const rows: { studentId: string; activityId: string; reason: string }[] = []
    for (const c of input.scores) {
      const s = student.get(c.studentId)
      const a = activity.get(c.activityId)
      const refuse = (reason: string) =>
        rows.push({ studentId: c.studentId, activityId: c.activityId, reason })
      if (!s || !a) refuse("นักศึกษาหรือกิจกรรมไม่ใช่ของรายวิชานี้")
      else if (a.closedAt) refuse(`${a.name} ปิดรับคะแนนแล้ว — เปิดรับคะแนนอีกครั้งก่อนแก้`)
      else if (s.status === "WITHDRAWN") refuse(`${s.studentCode} ถอนรายวิชาแล้ว`)
      else if (s.grade) refuse(`${s.studentCode} เกรดถูกตรึงแล้ว`)
      else if (typeof c.score === "number" && c.score > a.maxScore) {
        refuse(`คะแนนเกินคะแนนเต็ม ${a.maxScore}`)
      } else if (c.score !== "EXCUSED" && c.reason !== undefined) {
        refuse("เหตุผลใส่ได้เฉพาะช่องที่ยกเว้น")
      }
    }
    if (rows.length)
      throw new BusinessRuleError("มีช่องที่บันทึกไม่ได้ — ไม่ได้บันทึกช่องใดเลย", { rows })

    const cells: IncomingCell[] = input.scores.map((c) => ({
      studentId: c.studentId,
      activityId: c.activityId,
      to: fromGrid(c.score, c.reason),
      seen: c.from,
    }))
    const result = await this.scores.writeIfUnchanged(cells, input.source, userId)
    if (result.conflicts.length) {
      throw new ConflictError("มีคนแก้ช่องเหล่านี้ไปก่อนแล้ว — โหลดใหม่แล้วตรวจอีกครั้ง", {
        cells: result.conflicts.map((c) => ({ ...c, current: toGrid(c.current) })),
      })
    }
    return { written: result.written, unchanged: input.scores.length - result.written }
  }

  // ── Excel (design #58-#60) ──

  async template(courseId: string) {
    const [c, [students, activities]] = await Promise.all([
      this.scores.courseHeader(courseId),
      this.scores.roster(courseId),
    ])
    const buffer = buildWorkbook([
      {
        name: "คะแนน",
        title: "แบบฟอร์มกรอกคะแนน",
        info: [
          ["รายวิชา", `${c.code} ${c.name}`],
          ["Sec", c.section],
          ["ภาค/ปีการศึกษา", `${c.semester}/${c.year}`],
          ["ผู้สอน", c.instructors.map((i) => i.user.name).join(" · ")],
          [
            "วิธีกรอก",
            'ช่องว่าง = ยังไม่ประเมิน · 0 = ได้ 0 คะแนน · พิมพ์ "ยกเว้น" เพื่อไม่นับกิจกรรมนั้น',
          ],
        ],
        head: [STUDENT_CODE_HEADER, NAME_HEADER, ...activities.map(activityHeader)],
        rows: students
          .filter((s) => s.status === "ENROLLED")
          .map((s) => [s.studentCode, s.name, ...activities.map(() => null)]),
      },
    ])
    return { buffer, fileName: `scores-${c.code}-${c.section}-${fileStamp()}.xlsx` }
  }

  /** Design #59 · FR-69: every row checked, nothing written, empty cells never overwrite. */
  async previewImport(courseId: string, userId: string, file: Buffer, fileName: string) {
    const table = readTable(file)
    const [students, activities] = await this.scores.roster(courseId)
    const byCode = new Map(students.map((s) => [s.studentCode, s]))

    // A column is found by the [id] the template writes, else by its name before " (เต็ม".
    const columns = table.headers.slice(2).map((header, i) => {
      const id = /\[([^\]]+)\]\s*$/.exec(header)?.[1]
      const name = header.replace(/\s*\(เต็ม[^)]*\)\s*(\[[^\]]*\])?\s*$/, "").trim()
      const a = activities.find((x) => x.id === id) ?? activities.find((x) => x.name === name)
      return { index: i + 2, header, activityId: a?.id ?? null, matched: Boolean(a) }
    })
    const activityById = new Map(activities.map((a) => [a.id, a]))

    const seen = new Set<string>()
    const data: ScorePreview = { fileName, cells: [], okRows: 0, failedRows: 0, rejects: [] }
    const rows: {
      row: number
      studentCode: string
      status: "OK" | "ERROR"
      values: Record<string, number | "EXCUSED">
      errorCode: string | null
      message: string | null
    }[] = []

    for (const { row, cells } of table.rows) {
      const studentCode = asText(cells[0])
      const values: Record<string, number | "EXCUSED"> = {}
      const errors: { code: string; field: string; value: string; message: string }[] = []
      const fail = (code: string, field: string, value: unknown, message: string) =>
        errors.push({ code, field, value: asText(value).slice(0, 255), message })

      const s = byCode.get(studentCode)
      if (!studentCode) fail("MISSING_CODE", STUDENT_CODE_HEADER, "", "ไม่ได้กรอกรหัสนักศึกษา")
      else if (seen.has(studentCode))
        fail("DUPLICATE_IN_FILE", STUDENT_CODE_HEADER, studentCode, "รหัสซ้ำกับแถวก่อนหน้าในไฟล์")
      else if (!s)
        fail(
          "STUDENT_NOT_IN_COURSE",
          STUDENT_CODE_HEADER,
          studentCode,
          "ไม่มีรหัสนี้ในรายวิชา — เพิ่มรายชื่อก่อน",
        )
      else if (s.status === "WITHDRAWN")
        fail("STUDENT_WITHDRAWN", STUDENT_CODE_HEADER, studentCode, "นักศึกษาถอนรายวิชาแล้ว")
      else if (s.grade) fail("GRADE_FROZEN", STUDENT_CODE_HEADER, studentCode, "เกรดถูกตรึงแล้ว")
      if (studentCode) seen.add(studentCode)

      for (const col of columns) {
        const raw = cells[col.index]
        if (raw === null || raw === undefined || asText(raw) === "") continue // FR-62: never overwrite with blank
        if (!col.activityId) {
          fail("UNKNOWN_COLUMN", col.header, raw, "คอลัมน์นี้ไม่ตรงกับกิจกรรมใดในรายวิชา")
          continue
        }
        const a = activityById.get(col.activityId)!
        if (EXCUSED_WORDS.has(asText(raw))) {
          values[a.id] = "EXCUSED"
        } else {
          const n = typeof raw === "number" ? raw : Number(asText(raw))
          if (!Number.isFinite(n))
            fail("NOT_A_NUMBER", a.name, raw, "คะแนนต้องเป็นตัวเลข หรือคำว่า ยกเว้น")
          else if (n < 0) fail("NEGATIVE", a.name, raw, "คะแนนติดลบไม่ได้")
          else if (n > a.maxScore)
            fail("ABOVE_MAX", a.name, raw, `คะแนนเกินคะแนนเต็ม ${a.maxScore}`)
          else values[a.id] = n
        }
        if (a.closedAt) fail("ACTIVITY_CLOSED", a.name, raw, `${a.name} ปิดรับคะแนนแล้ว`)
      }

      if (errors.length) {
        data.failedRows++
        rows.push({
          row,
          studentCode,
          status: "ERROR",
          values,
          errorCode: errors[0]!.code,
          message: errors.map((e) => e.message).join(" · "),
        })
        for (const e of errors)
          data.rejects.push({ row, studentCode, field: e.field, value: e.value, reason: e.message })
      } else {
        rows.push({ row, studentCode, status: "OK", values, errorCode: null, message: null })
        data.okRows++
        for (const [activityId, v] of Object.entries(values)) {
          data.cells.push({
            studentId: s!.id,
            activityId,
            to: v === "EXCUSED" ? { excused: true, reason: null } : { score: v, excused: false },
          })
        }
      }
    }

    return {
      previewToken: savePreview("SCORE", courseId, userId, data),
      fileName,
      summary: { total: rows.length, ok: data.okRows, failed: rows.length - data.okRows },
      columns: columns.map(({ index: _i, ...c }) => c),
      rows,
    }
  }

  async commitImport(courseId: string, userId: string, token: string) {
    const data = takePreview<ScorePreview>("SCORE", token, courseId, userId)
    if (!data) throw new BusinessRuleError(PREVIEW_GONE)
    return this.scores.commitImport(
      courseId,
      userId,
      data.fileName,
      data.cells,
      data.okRows,
      data.failedRows,
      data.rejects,
    )
  }

  // ── history (design #62-#64) ──

  async uploads(
    courseId: string,
    query: { kind?: "SCORES" | "SCORE" | "ROSTER"; page: number; perPage: number },
  ) {
    const kind = query.kind === "SCORES" ? "SCORE" : query.kind
    const { total, rows } = await this.scores.uploads(
      courseId,
      kind,
      (query.page - 1) * query.perPage,
      query.perPage,
    )
    return {
      data: rows.map(({ uploader, ...r }) => ({ ...r, uploadedBy: uploader })),
      meta: { total, page: query.page, perPage: query.perPage },
    }
  }

  async uploadErrors(uploadId: string) {
    return this.scores.uploadRejects(uploadId)
  }

  uploadErrorsWorkbook(
    rejects: Awaited<ReturnType<ScoreService["uploadErrors"]>>,
    uploadId: string,
  ) {
    const buffer = buildWorkbook([
      {
        name: "แถวที่ไม่ผ่าน",
        title: "แถวที่นำเข้าไม่ผ่าน — แก้ในไฟล์แล้วนำเข้าใหม่",
        info: [],
        head: ["แถว", "รหัสนักศึกษา", "ช่อง", "ค่าที่กรอก", "เหตุผล"],
        rows: rejects.map((r) => [r.row, r.studentCode, r.field, r.value, r.reason]),
      },
    ])
    return { buffer, fileName: `upload-errors-${uploadId}.xlsx` }
  }

  async changes(
    courseId: string,
    query: { studentId?: string; activityId?: string; page: number; perPage: number },
  ) {
    const where = {
      activity: { courseId },
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.activityId ? { activityId: query.activityId } : {}),
    }
    const { total, rows } = await this.scores.changes(
      where,
      (query.page - 1) * query.perPage,
      query.perPage,
    )
    const side = (score: number | null, excused: boolean): GridValue =>
      excused ? "EXCUSED" : score
    return {
      data: rows.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentCode: r.student.studentCode,
        activityId: r.activityId,
        activityName: r.activity.name,
        from: side(r.fromScore, r.fromExcused),
        to: side(r.toScore, r.toExcused),
        source: r.source,
        changedBy: r.changer,
        changedAt: r.changedAt,
        note: r.note,
      })),
      meta: { total, page: query.page, perPage: query.perPage },
    }
  }
}
