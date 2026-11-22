/** Characterization tests (refactor-plan.md P0): pin StudentService's rules today. */
import * as XLSX from "xlsx"
import { afterEach, describe, expect, it, vi } from "vitest"
import { BusinessRuleError, NotFoundError } from "../../lib/errors.js"
import { buildWorkbook, NAME_HEADER, STUDENT_CODE_HEADER } from "../../lib/excel.js"
import type { StudentRepository } from "./student.repository.js"
import { StudentService } from "./students.service.js"

const header = {
  code: "90641001",
  name: "วิชาทดสอบ",
  section: "01",
  semester: 1,
  year: 2569,
  instructors: [{ user: { name: "ก" } }, { user: { name: "ข" } }],
}
const student = (over: Record<string, unknown> = {}) => ({
  id: "s1",
  courseId: "k1",
  studentCode: "001",
  name: "หนึ่ง",
  status: "ENROLLED",
  withdrawnAt: null,
  grade: null,
  ...over,
})

function setup(over: Record<string, unknown> = {}) {
  const repo = {
    list: vi.fn(async () => ({
      total: 1,
      rows: [{ ...student(), _count: { scores: 2 } }],
    })),
    countActivities: vi.fn(async () => 5),
    create: vi.fn(async () => student()),
    update: vi.fn(async (_id: string, data: Record<string, unknown>) => student(data)),
    findById: vi.fn(async () => student() as ReturnType<typeof student> | null),
    deleteImpact: vi.fn(async () => ({ scores: 0, grades: 0 })),
    delete: vi.fn(async () => {}),
    cloInCourse: vi.fn(async () => true),
    upsertPlan: vi.fn(async () => ({
      studentId: "s1",
      cloId: "c1",
      plan: "p",
      editor: { id: "u1", name: "ครู" },
    })),
    deletePlan: vi.fn(async () => ({ count: 1 })),
    courseHeader: vi.fn(async () => header),
    rosterForExport: vi.fn(async () => [
      { studentCode: "001", name: "หนึ่ง", status: "ENROLLED" },
      { studentCode: "002", name: "สอง", status: "WITHDRAWN" },
    ]),
    codesInCourse: vi.fn(async () => [{ studentCode: "001" }]),
    commitRoster: vi.fn(async () => ({ uploadId: "up1" })),
    ...over,
  }
  return { service: new StudentService(repo as unknown as StudentRepository), repo }
}

const roster = (rows: unknown[][]) =>
  buildWorkbook([
    {
      name: "รายชื่อ",
      title: "รายชื่อ",
      info: [],
      head: [STUDENT_CODE_HEADER, NAME_HEADER],
      rows: rows as never,
    },
  ])

afterEach(() => vi.useRealTimers())

describe("list", () => {
  it("builds the where, pages by offset and adds scored / activity counts", async () => {
    const { service, repo } = setup()
    const r = await service.list("k1", {
      sort: "name:desc",
      page: 3,
      perPage: 10,
      status: "ENROLLED",
      q: "หนึ่ง",
    } as never)
    expect(repo.list).toHaveBeenCalledWith(
      {
        courseId: "k1",
        status: "ENROLLED",
        OR: [
          { studentCode: { contains: "หนึ่ง" } },
          { name: { contains: "หนึ่ง", mode: "insensitive" } },
        ],
      },
      { name: "desc" },
      20,
      10,
    )
    expect(r.data[0]).toMatchObject({ scoredCount: 2, activityCount: 5 })
    expect(r.data[0]).not.toHaveProperty("courseId")
    expect(r.meta).toEqual({ total: 1, page: 3, perPage: 10 })
  })

  it("ALL shows withdrawn students too (no status filter)", async () => {
    const { service, repo } = setup()
    await service.list("k1", {
      sort: "studentCode:asc",
      page: 1,
      perPage: 10,
      status: "ALL",
    } as never)
    expect((repo.list.mock.calls[0] as unknown as [object])[0]).toEqual({ courseId: "k1" })
  })
})

describe("create / update", () => {
  it("hide the courseId from the response", async () => {
    const { service } = setup()
    expect(
      await service.create("k1", { studentCode: "001", name: "x" } as never),
    ).not.toHaveProperty("courseId")
    expect(await service.update("s1", { name: "y" } as never)).not.toHaveProperty("courseId")
  })
})

describe("remove", () => {
  it("deletes at once when nothing hangs off the student", async () => {
    const { service, repo } = setup()
    expect(await service.remove("s1", false)).toEqual({ deleted: true })
    expect(repo.delete).toHaveBeenCalledWith("s1")
  })

  it("with scores or a grade it shows the impact until confirmed", async () => {
    const { service, repo } = setup({ deleteImpact: vi.fn(async () => ({ scores: 3, grades: 0 })) })
    expect(await service.remove("s1", false)).toEqual({
      deleted: false,
      impact: { scores: 3, grades: 0 },
    })
    expect(repo.delete).not.toHaveBeenCalled()
    expect(await service.remove("s1", true)).toEqual({ deleted: true })
  })
})

describe("withdraw / restore", () => {
  it("withdraw stamps today's date (UTC) and keeps the scores", async () => {
    vi.useFakeTimers().setSystemTime(new Date("2026-11-22T20:30:00Z"))
    const { service, repo } = setup()
    const r = await service.withdraw("s1")
    expect(repo.update).toHaveBeenCalledWith("s1", {
      status: "WITHDRAWN",
      withdrawnAt: new Date("2026-11-22T00:00:00Z"),
    })
    expect(r).toEqual({ status: "WITHDRAWN", withdrawnAt: new Date("2026-11-22T00:00:00Z") })
  })

  it.each([
    [{ status: "WITHDRAWN" }, "ถอนรายวิชาแล้ว"],
    [{ grade: { grade: "A" } }, "เกรดถูกตรึงแล้ว"],
  ])("withdraw refuses %o", async (over, message) => {
    const { service, repo } = setup({ findById: vi.fn(async () => student(over)) })
    await expect(service.withdraw("s1")).rejects.toThrow(message)
    expect(repo.update).not.toHaveBeenCalled()
  })

  it("withdraw and restore of a missing student are 404s", async () => {
    const { service } = setup({ findById: vi.fn(async () => null) })
    await expect(service.withdraw("s1")).rejects.toBeInstanceOf(NotFoundError)
    await expect(service.restore("s1")).rejects.toBeInstanceOf(NotFoundError)
  })

  it("restore clears the date, and refuses a student who never withdrew", async () => {
    const withdrawn = setup({ findById: vi.fn(async () => student({ status: "WITHDRAWN" })) })
    expect(await withdrawn.service.restore("s1")).toEqual({ status: "ENROLLED", withdrawnAt: null })
    await expect(setup().service.restore("s1")).rejects.toThrow("ยังไม่ได้ถอนรายวิชา")
  })
})

describe("remediation plans", () => {
  it("save returns the editor as updatedBy", async () => {
    const { service } = setup()
    expect(await service.savePlan("s1", "c1", "k1", "p", "u1")).toEqual({
      studentId: "s1",
      cloId: "c1",
      plan: "p",
      updatedBy: { id: "u1", name: "ครู" },
    })
  })

  it("a CLO of another course is a 404 for save and delete", async () => {
    const { service, repo } = setup({ cloInCourse: vi.fn(async () => false) })
    await expect(service.savePlan("s1", "c9", "k1", "p", "u1")).rejects.toBeInstanceOf(
      NotFoundError,
    )
    await expect(service.deletePlan("s1", "c9", "k1")).rejects.toBeInstanceOf(NotFoundError)
    expect(repo.upsertPlan).not.toHaveBeenCalled()
  })

  it("deleting a plan that is not there is a 404", async () => {
    const { service } = setup({ deletePlan: vi.fn(async () => ({ count: 0 })) })
    await expect(service.deletePlan("s1", "c1", "k1")).rejects.toThrow("ไม่มีแผน")
    expect(await setup().service.deletePlan("s1", "c1", "k1")).toEqual({ deleted: true })
  })
})

describe("Excel", () => {
  /** Rows as the sheet holds them, without the null padding to the table's width. */
  const read = (buf: Buffer, sheet = "รายชื่อ") =>
    XLSX.utils
      .sheet_to_json<unknown[]>(XLSX.read(buf, { type: "buffer" }).Sheets[sheet]!, {
        header: 1,
        defval: null,
      })
      .map((row) => {
        const r = [...row]
        while (r.length && r.at(-1) === null) r.pop()
        return r
      })

  it("template: an empty table under the course header", async () => {
    const r = await setup().service.template("k1")
    expect(r.fileName).toMatch(/^roster-90641001-01-\d{12}\.xlsx$/)
    const grid = read(r.buffer)
    expect(grid).toContainEqual(["ผู้สอน", "ก · ข"])
    expect(grid.at(-1)).toEqual([STUDENT_CODE_HEADER, NAME_HEADER])
  })

  it("export: codes and names with a status, no score or grade", async () => {
    const r = await setup().service.exportRoster("k1")
    const grid = read(r.buffer)
    expect(grid).toContainEqual(["จำนวน", "2"])
    expect(grid).toContainEqual(["001", "หนึ่ง", "ปกติ"])
    expect(grid).toContainEqual(["002", "สอง", "ถอนรายวิชา"])
  })

  it("preview: classifies every row and writes nothing", async () => {
    const { service, repo } = setup()
    const r = await service.previewImport(
      "k1",
      "u1",
      roster([
        ["001", "ชื่อใหม่ไม่ถูกใช้"],
        ["002", "สอง"],
        ["002", "ซ้ำ"],
        ["", "ไม่มีรหัส"],
        ["x".repeat(21), "ยาว"],
        ["003", ""],
      ]),
      "r.xlsx",
    )
    expect(repo.commitRoster).not.toHaveBeenCalled()
    expect(r.rows.map((x) => [x.studentCode.slice(0, 3), x.status, x.errorCode])).toEqual([
      ["001", "EXISTS", null],
      ["002", "ADD", null],
      ["002", "ERROR", "DUPLICATE_IN_FILE"],
      ["", "ERROR", "MISSING_CODE"],
      ["xxx", "ERROR", "CODE_TOO_LONG"],
      ["003", "ERROR", "MISSING_NAME"],
    ])
    expect(r.summary).toEqual({ total: 6, add: 1, failed: 4 })
  })

  it("commit sends only the new students plus the rejects, once per token and user", async () => {
    const { service, repo } = setup()
    const p = await service.previewImport(
      "k1",
      "u1",
      roster([
        ["002", "สอง"],
        ["003", ""],
      ]),
      "r.xlsx",
    )
    await service.commitImport("k1", "u1", p.previewToken)
    expect(repo.commitRoster).toHaveBeenCalledWith(
      "k1",
      "u1",
      "r.xlsx",
      [{ studentCode: "002", name: "สอง" }],
      [
        {
          row: expect.any(Number),
          studentCode: "003",
          field: NAME_HEADER,
          value: "",
          reason: "ไม่ได้กรอกชื่อ-นามสกุล",
        },
      ],
    )
    await expect(service.commitImport("k1", "u1", p.previewToken)).rejects.toBeInstanceOf(
      BusinessRuleError,
    )
  })

  it("another user's attempt is refused AND burns the token (read once, whoever reads it)", async () => {
    const { service, repo } = setup()
    const p = await service.previewImport("k1", "u1", roster([["002", "สอง"]]), "r.xlsx")
    await expect(service.commitImport("k1", "u2", p.previewToken)).rejects.toBeInstanceOf(
      BusinessRuleError,
    )
    await expect(service.commitImport("k1", "u1", p.previewToken)).rejects.toBeInstanceOf(
      BusinessRuleError,
    )
    expect(repo.commitRoster).not.toHaveBeenCalled()
  })
})
