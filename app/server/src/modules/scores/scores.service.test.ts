/**
 * Characterization tests (refactor-plan.md P0): pin what ScoreService does today,
 * so P3 can move CourseRevisionRepository without changing a response.
 */
import * as XLSX from "xlsx"
import { describe, expect, it, vi } from "vitest"
import { BusinessRuleError, ConflictError } from "../../lib/errors.js"
import { activityHeader, buildWorkbook, NAME_HEADER, STUDENT_CODE_HEADER } from "../../lib/excel.js"
import type { ScoreRepository } from "./score.repository.js"
import { courseHeader, ScoreService } from "./scores.service.js"

const dec = (n: number) => ({ toString: () => String(n) })
const course = {
  code: "90641001",
  name: "วิชาทดสอบ",
  nameEn: null,
  section: "01",
  semester: 1,
  year: 2569,
  credits: dec(3),
  lectureHours: dec(2),
  practiceHours: dec(1.5),
  selfStudyHours: dec(5),
  instructors: [{ user: { name: "ข" } }, { user: { name: "ก" } }],
}

const a1 = { id: "a1", name: "Quiz 1", maxScore: 10, closedAt: null as Date | null }
const a2 = { id: "a2", name: "Quiz 2", maxScore: 20, closedAt: null as Date | null }
const student = (id: string, code: string, over: Record<string, unknown> = {}) => ({
  id,
  studentCode: code,
  name: `นักศึกษา ${code}`,
  status: "ENROLLED",
  grade: null as unknown,
  ...over,
})

function setup(over: Partial<Record<keyof ScoreRepository, unknown>> = {}) {
  const base = {
    grid: vi.fn(async () => ({
      course,
      activities: [
        { ...a1, passScore: null, passMark: 50 },
        { ...a2, passScore: 12, passMark: 50 },
      ],
      total: 2,
      enrolled: 2,
      progress: [{ activityId: "a1", _count: { _all: 1 } }],
      students: [
        {
          ...student("s1", "001"),
          scores: [
            { activityId: "a1", score: 7, status: "SCORED", excuseReason: null },
            { activityId: "a2", score: null, status: "EXCUSED", excuseReason: "ป่วย" },
          ],
        },
        { ...student("s2", "002"), scores: [] },
      ],
    })),
    context: vi.fn(async () => ({
      students: [
        student("s1", "001"),
        student("s2", "002", { status: "WITHDRAWN" }),
        student("s3", "003", { grade: { grade: "A" } }),
      ],
      activities: [a1, { ...a2, closedAt: new Date(0) }],
    })),
    writeIfUnchanged: vi.fn(async (_cells: unknown[], _source: string, _userId: string) => ({
      written: 1,
      conflicts: [] as unknown[],
    })),
    courseHeader: vi.fn(async () => course),
    roster: vi.fn(async () => [
      [
        student("s1", "001"),
        student("s2", "002", { status: "WITHDRAWN" }),
        student("s3", "003", { grade: { grade: "A" } }),
        student("s4", "004"),
      ],
      [a1, a2],
    ]),
    commitImport: vi.fn(async () => ({ uploadId: "up1" })),
    uploads: vi.fn(async () => ({
      total: 1,
      rows: [{ id: "up1", uploader: { id: "u1", name: "ครู" } }],
    })),
    uploadRejects: vi.fn(async () => []),
    changes: vi.fn(async () => ({
      total: 1,
      rows: [
        {
          id: "ch1",
          studentId: "s1",
          student: { studentCode: "001" },
          activityId: "a1",
          activity: { name: "Quiz 1" },
          fromScore: null,
          fromExcused: true,
          toScore: 7,
          toExcused: false,
          source: "WEB",
          changer: { id: "u1", name: "ครู" },
          changedAt: new Date(0),
          note: null,
        },
      ],
    })),
  }
  const repo = { ...base, ...over } as typeof base
  const revisions = { bump: vi.fn(async (): Promise<number> => 5) }
  const service = new ScoreService(repo as unknown as ScoreRepository, revisions)
  return { service, repo, revisions }
}

/** A file shaped like the template: the [id] column tags let the import find activities. */
function upload(rows: unknown[][], head = [a1, a2].map(activityHeader)) {
  return buildWorkbook([
    {
      name: "คะแนน",
      title: "แบบฟอร์มกรอกคะแนน",
      info: [],
      head: [STUDENT_CODE_HEADER, NAME_HEADER, ...head],
      rows: rows as never,
    },
  ])
}

describe("courseHeader", () => {
  it("prints credits the faculty way and sorts instructors in Thai order", () => {
    expect(courseHeader(course)).toMatchObject({
      credits: "3 (2-1.5-5)",
      instructors: ["ก", "ข"],
    })
  })
})

describe("grid", () => {
  it("maps cells to number / EXCUSED / null and pages by offset", async () => {
    const { service, repo } = setup()
    const r = await service.grid("k1", { status: "ENROLLED", page: 3, perPage: 10 })
    expect(repo.grid).toHaveBeenCalledWith("k1", true, 20, 10)
    expect(r.data.students.map((s) => s.scores)).toEqual([{ a1: 7, a2: "EXCUSED" }, {}])
    // passScore falls back to passMark% of maxScore.
    expect(r.data.activities.map((a) => a.passScore)).toEqual([5, 12])
    expect(r.meta).toEqual({
      total: 2,
      page: 3,
      perPage: 10,
      progress: { a1: { scored: 1, total: 2 }, a2: { scored: 0, total: 2 } },
    })
  })
})

describe("put (FR-63: all or nothing)", () => {
  const put = (service: ScoreService, scores: unknown[]) =>
    service.put("k1", { source: "WEB", scores } as never, "u1")

  it("collects every refused cell into one 422 and writes nothing", async () => {
    const { service, repo } = setup()
    const err = await put(service, [
      { studentId: "zz", activityId: "a1", score: 1, from: null },
      { studentId: "s1", activityId: "a2", score: 1, from: null },
      { studentId: "s2", activityId: "a1", score: 1, from: null },
      { studentId: "s3", activityId: "a1", score: 1, from: null },
      { studentId: "s1", activityId: "a1", score: 11, from: null },
      { studentId: "s1", activityId: "a1", score: 5, reason: "x", from: null },
    ]).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(BusinessRuleError)
    const rows = (err as { errors: { rows: { reason: string }[] } }).errors.rows
    expect(rows.map((r) => r.reason)).toEqual([
      "นักศึกษาหรือกิจกรรมไม่ใช่ของรายวิชานี้",
      "Quiz 2 ปิดรับคะแนนแล้ว — เปิดรับคะแนนอีกครั้งก่อนแก้",
      "002 ถอนรายวิชาแล้ว",
      "003 เกรดถูกตรึงแล้ว",
      "คะแนนเกินคะแนนเต็ม 10",
      "เหตุผลใส่ได้เฉพาะช่องที่ยกเว้น",
    ])
    expect(repo.writeIfUnchanged).not.toHaveBeenCalled()
  })

  it("writes valid cells, bumps the revision and reports unchanged ones", async () => {
    const { service, repo, revisions } = setup()
    const r = await put(service, [
      { studentId: "s1", activityId: "a1", score: 8, from: 7 },
      { studentId: "s1", activityId: "a1", score: "EXCUSED", reason: "ป่วย", from: 8 },
    ])
    expect(repo.writeIfUnchanged).toHaveBeenCalledWith(
      [
        { studentId: "s1", activityId: "a1", to: { score: 8, excused: false }, seen: 7 },
        { studentId: "s1", activityId: "a1", to: { excused: true, reason: "ป่วย" }, seen: 8 },
      ],
      "WEB",
      "u1",
    )
    expect(revisions.bump).toHaveBeenCalledWith("k1")
    expect(r).toEqual({ written: 1, unchanged: 1, revision: 5 })
  })

  it("clearing a cell sends null", async () => {
    const { service, repo } = setup()
    await put(service, [{ studentId: "s1", activityId: "a1", score: null, from: 7 }])
    expect(repo.writeIfUnchanged.mock.calls[0]![0]).toEqual([
      { studentId: "s1", activityId: "a1", to: null, seen: 7 },
    ])
  })

  it("a cell changed meanwhile is a 409 carrying the current grid value", async () => {
    const { service, revisions } = setup({
      writeIfUnchanged: vi.fn(async () => ({
        written: 0,
        conflicts: [
          { studentId: "s1", activityId: "a1", current: { excused: true, reason: null } },
        ],
      })),
    })
    const err = await put(service, [
      { studentId: "s1", activityId: "a1", score: 8, from: 7 },
    ]).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ConflictError)
    expect((err as { errors: unknown }).errors).toEqual({
      cells: [{ studentId: "s1", activityId: "a1", current: "EXCUSED" }],
    })
    expect(revisions.bump).not.toHaveBeenCalled()
  })

  it("a failed revision bump still returns the write, with revision null", async () => {
    const { service, revisions } = setup()
    revisions.bump.mockRejectedValueOnce(new Error("db down"))
    const r = await put(service, [{ studentId: "s1", activityId: "a1", score: 8, from: 7 }])
    expect(r.revision).toBeNull()
  })
})

describe("template", () => {
  it("lists only enrolled students under one column per activity", async () => {
    const { service } = setup()
    const r = await service.template("k1")
    expect(r.fileName).toMatch(/^scores-90641001-01-\d{12}\.xlsx$/)
    const wb = XLSX.read(r.buffer, { type: "buffer" })
    const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["คะแนน"]!, { header: 1 })
    const head = grid.find((row) => row[0] === STUDENT_CODE_HEADER)!
    expect(head.slice(2)).toEqual(["Quiz 1 (เต็ม 10) [a1]", "Quiz 2 (เต็ม 20) [a2]"])
    const codes = grid.slice(grid.indexOf(head) + 1).map((row) => row[0])
    expect(codes).toEqual(["001", "003", "004"])
  })
})

describe("previewImport (FR-69)", () => {
  it("checks every row, writes nothing, and never imports a blank cell", async () => {
    const { service, repo } = setup()
    const r = await service.previewImport(
      "k1",
      "u1",
      upload([
        ["001", "x", 8, "ยกเว้น"],
        ["004", "x", null, 15],
        ["001", "x", 1, 1],
        ["002", "x", 1, null],
        ["003", "x", 1, null],
        ["999", "x", 1, null],
        ["", "x", 1, null],
      ]),
      "s.xlsx",
    )
    expect(repo.commitImport).not.toHaveBeenCalled()
    expect(r.summary).toEqual({ total: 7, ok: 2, failed: 5 })
    expect(r.rows.map((x) => [x.studentCode, x.errorCode])).toEqual([
      ["001", null],
      ["004", null],
      ["001", "DUPLICATE_IN_FILE"],
      ["002", "STUDENT_WITHDRAWN"],
      ["003", "GRADE_FROZEN"],
      ["999", "STUDENT_NOT_IN_COURSE"],
      ["", "MISSING_CODE"],
    ])
    expect(r.rows[0]!.values).toEqual({ a1: 8, a2: "EXCUSED" })
    expect(r.rows[1]!.values).toEqual({ a2: 15 })
    expect(r.columns).toEqual([
      { header: "Quiz 1 (เต็ม 10) [a1]", activityId: "a1", matched: true },
      { header: "Quiz 2 (เต็ม 20) [a2]", activityId: "a2", matched: true },
    ])
  })

  it("refuses bad values per cell and names an unknown column", async () => {
    const { service } = setup()
    const r = await service.previewImport(
      "k1",
      "u1",
      upload([["001", "x", "abc", -1, 3]], [...[a1, a2].map(activityHeader), "Lab (เต็ม 5)"]),
      "s.xlsx",
    )
    expect(r.columns[2]).toEqual({ header: "Lab (เต็ม 5)", activityId: null, matched: false })
    expect(r.rows[0]!.message).toBe(
      "คะแนนต้องเป็นตัวเลข หรือคำว่า ยกเว้น · คะแนนติดลบไม่ได้ · คอลัมน์นี้ไม่ตรงกับกิจกรรมใดในรายวิชา",
    )
    expect(r.rows[0]!.errorCode).toBe("NOT_A_NUMBER")
  })

  it("finds a column by activity name when the [id] tag is gone, and refuses above max", async () => {
    const { service } = setup()
    const r = await service.previewImport(
      "k1",
      "u1",
      upload([["001", "x", 11, null]], ["Quiz 1 (เต็ม 10)", "Quiz 2"]),
      "s.xlsx",
    )
    expect(r.columns.map((c) => c.activityId)).toEqual(["a1", "a2"])
    expect(r.rows[0]).toMatchObject({ errorCode: "ABOVE_MAX", message: "คะแนนเกินคะแนนเต็ม 10" })
  })

  it("commit writes only the OK rows' cells, once per token", async () => {
    const { service, repo } = setup()
    const p = await service.previewImport(
      "k1",
      "u1",
      upload([
        ["001", "x", 8, "ยกเว้น"],
        ["002", "x", 1, null],
      ]),
      "s.xlsx",
    )
    await service.commitImport("k1", "u1", p.previewToken)
    expect(repo.commitImport).toHaveBeenCalledWith(
      "k1",
      "u1",
      "s.xlsx",
      [
        { studentId: "s1", activityId: "a1", to: { score: 8, excused: false } },
        { studentId: "s1", activityId: "a2", to: { excused: true, reason: null } },
      ],
      1,
      1,
      [
        {
          row: expect.any(Number),
          studentCode: "002",
          field: STUDENT_CODE_HEADER,
          value: "002",
          reason: "นักศึกษาถอนรายวิชาแล้ว",
        },
      ],
    )
    await expect(service.commitImport("k1", "u1", p.previewToken)).rejects.toBeInstanceOf(
      BusinessRuleError,
    )
  })

  it("a token is refused for another user", async () => {
    const { service } = setup()
    const p = await service.previewImport("k1", "u1", upload([["001", "x", 8, null]]), "s.xlsx")
    await expect(service.commitImport("k1", "u2", p.previewToken)).rejects.toBeInstanceOf(
      BusinessRuleError,
    )
  })
})

describe("history", () => {
  it("uploads: SCORES is an alias of SCORE, uploader becomes uploadedBy", async () => {
    const { service, repo } = setup()
    const r = await service.uploads("k1", { kind: "SCORES", page: 2, perPage: 5 })
    expect(repo.uploads).toHaveBeenCalledWith("k1", "SCORE", 5, 5)
    expect(r).toEqual({
      data: [{ id: "up1", uploadedBy: { id: "u1", name: "ครู" } }],
      meta: { total: 1, page: 2, perPage: 5 },
    })
  })

  it("changes: filters are optional and each side reads number / EXCUSED", async () => {
    const { service, repo } = setup()
    const r = await service.changes("k1", { studentId: "s1", page: 1, perPage: 20 })
    expect(repo.changes).toHaveBeenCalledWith(
      { activity: { courseId: "k1" }, studentId: "s1" },
      0,
      20,
    )
    expect(r.data[0]).toMatchObject({ from: "EXCUSED", to: 7, studentCode: "001" })
  })

  it("upload errors workbook: one row per reject", () => {
    const { service } = setup()
    const r = service.uploadErrorsWorkbook(
      [{ row: 3, studentCode: "001", field: "Quiz 1", value: "x", reason: "bad" }] as never,
      "up1",
    )
    expect(r.fileName).toBe("upload-errors-up1.xlsx")
    const wb = XLSX.read(r.buffer, { type: "buffer" })
    const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["แถวที่ไม่ผ่าน"]!, { header: 1 })
    expect(grid).toContainEqual(["3", "001", "Quiz 1", "x", "bad"])
  })
})
