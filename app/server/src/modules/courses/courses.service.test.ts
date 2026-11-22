/**
 * Characterization tests (refactor-plan.md P0): pin CourseService's rules today,
 * so P3 can move the authorization lookups behind a repository unchanged.
 */
import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { BusinessRuleError, NotFoundError } from "../../lib/errors.js"
import { CourseNotFoundError } from "../authorization/authorization.service.js"
import type { CourseRepository } from "./course.repository.js"
import { CourseService, toCourseDto } from "./courses.service.js"

const see = vi.hoisted(() => ({ canSeeCourse: vi.fn(async () => true) }))
vi.mock("../authorization/authorization.service.js", async (orig) => ({
  ...(await orig<object>()),
  canSeeCourse: see.canSeeCourse,
}))

const D = (n: number) => new Prisma.Decimal(n)
const instructor = { userId: "u1", role: "INSTRUCTOR" } as const
const admin = { userId: "adm", role: "ADMIN" } as const
const okUser = (id: string) => ({ id, role: "INSTRUCTOR", isActive: true, status: "ACTIVE" })

function row(over: Record<string, unknown> = {}) {
  return {
    id: "k1",
    code: "03376120",
    name: "ระบบฐานข้อมูล",
    section: "01",
    semester: 1,
    year: 2568,
    gradeScale: "LETTER",
    gradeMethod: "CRITERION_REFERENCED",
    passCriteria: 50,
    credits: D(3),
    lectureHours: D(2),
    practiceHours: D(2),
    selfStudyHours: D(5),
    _count: { clos: 0, activities: 0, students: 0 },
    instructors: [{ userId: "u1", user: { name: "ครู" } }],
    ...over,
  }
}

function setup(over: Record<string, unknown> = {}) {
  const repo = {
    visibleTo: vi.fn((c: { role: string; userId: string }) =>
      c.role === "ADMIN" ? {} : { instructors: { some: { userId: c.userId } } },
    ),
    list: vi.fn(async () => ({ total: 1, rows: [row()] })),
    readinessInputs: vi.fn(async () => ({ clos: [], objectives: [], activities: [], cells: [] })),
    findById: vi.fn(async () => row() as ReturnType<typeof row> | null),
    findUsers: vi.fn(async (ids: string[]) => ids.map(okUser)),
    create: vi.fn(async () => row()),
    update: vi.fn(async () => row()),
    countFrozenGrades: vi.fn(async () => 0),
    setPassBand: vi.fn(async () => {}),
    impact: vi.fn(async () => ({ students: 3 })),
    delete: vi.fn(async () => {}),
    listInstructors: vi.fn(async () => [
      { userId: "u1", user: { name: "ครู", email: "t@x" }, assignedAt: new Date(0) },
    ]),
    addInstructor: vi.fn(async () => {}),
    removeInstructor: vi.fn(async () => "ok" as "ok" | "missing" | "last"),
    findTree: vi.fn(async () => row() as ReturnType<typeof row> | null),
    sectionsInUse: vi.fn(async () => [{ section: "01" }, { section: "02" }]),
    duplicate: vi.fn(async (_t: unknown, _o: unknown, _ids: string[]) => row({ id: "copy" })),
    yearPool: vi.fn(async () => [] as unknown[]),
    keysInYear: vi.fn(async () => new Set<string>()),
    ...over,
  }
  return { service: new CourseService(repo as unknown as CourseRepository), repo }
}

beforeEach(() => see.canSeeCourse.mockReset().mockResolvedValue(true))

const create = (input: Record<string, unknown>) => ({
  code: "03376120",
  name: "ระบบฐานข้อมูล",
  section: "01",
  semester: 1,
  year: 2569,
  gradeScale: "LETTER",
  gradeMethod: "CRITERION_REFERENCED",
  instructors: [],
  ...input,
})

describe("toCourseDto", () => {
  it("prints decimals as 3.0 and flattens instructors and counts", () => {
    expect(toCourseDto(row() as never)).toMatchObject({
      credits: "3.0",
      selfStudyHours: "5.0",
      counts: { clos: 0, activities: 0, students: 0 },
      instructors: [{ userId: "u1", name: "ครู" }],
    })
  })
})

describe("list", () => {
  it("builds the where from visibility and filters, and pages by offset", async () => {
    const { service, repo } = setup()
    const r = await service.list(
      { sort: "code:desc", page: 2, perPage: 10, year: 2568, q: "ฐาน" } as never,
      instructor,
    )
    expect(repo.list).toHaveBeenCalledWith(
      {
        instructors: { some: { userId: "u1" } },
        year: 2568,
        OR: [
          { code: { contains: "ฐาน", mode: "insensitive" } },
          { name: { contains: "ฐาน", mode: "insensitive" } },
          { nameEn: { contains: "ฐาน", mode: "insensitive" } },
        ],
      },
      { code: "desc" },
      10,
      10,
    )
    expect(r.meta).toEqual({ total: 1, page: 2, perPage: 10 })
    // An empty course is not ready: it carries the dashboard's blockers.
    expect(r.data[0]!.readiness.blockers.length).toBeGreaterThan(0)
  })
})

describe("get", () => {
  it("is a CourseNotFoundError when the row is gone", async () => {
    const { service } = setup({ findById: vi.fn(async () => null) })
    await expect(service.get("k1")).rejects.toBeInstanceOf(CourseNotFoundError)
  })
})

describe("create", () => {
  it("an instructor who creates a course teaches it, on the default A–F ladder", async () => {
    const { service, repo } = setup()
    const r = await service.create(create({}) as never, instructor)
    const [fields, ids, bands] = repo.create.mock.calls[0] as unknown as [
      { passCriteria: number },
      string[],
      { grade: string; minValue: number }[],
    ]
    expect(ids).toEqual(["u1"])
    // Criterion A–F: the pass mark is the D band's floor, not a typed number.
    expect(fields.passCriteria).toBe(bands.find((b) => b.grade === "D")!.minValue)
    expect(r.gradeBands).toEqual(bands)
  })

  it("an S/U course takes passCriteria, default 60", async () => {
    const { service, repo } = setup()
    await service.create(create({ gradeScale: "PASS_FAIL" }) as never, instructor)
    expect(
      (repo.create.mock.calls[0] as unknown as [{ passCriteria: number }])[0].passCriteria,
    ).toBe(60)
  })

  it.each([
    [{ gradeScale: "PASS_FAIL", gradeMethod: "NORM_REFERENCED" }, "ตัดเกรดอิงกลุ่มไม่ได้"],
    [{ passCriteria: 55 }, "ขอบล่างของเกรด D"],
  ])("refuses %o", async (input, message) => {
    const { service, repo } = setup()
    await expect(service.create(create(input) as never, instructor)).rejects.toThrow(message)
    expect(repo.create).not.toHaveBeenCalled()
  })

  it("an admin must name a teacher, and every teacher must be usable", async () => {
    const { service } = setup({
      findUsers: vi.fn(async () => [{ ...okUser("u9"), status: "PENDING" }]),
    })
    await expect(service.create(create({}) as never, admin)).rejects.toThrow(
      "ต้องระบุผู้สอนอย่างน้อย 1 คน",
    )
    await expect(
      service.create(create({ instructors: [{ userId: "u9" }] }) as never, admin),
    ).rejects.toThrow("บัญชีนี้ยังใช้งานไม่ได้")
  })
})

describe("update", () => {
  it("keeps the ladder when scale and method stay", async () => {
    const { service, repo } = setup()
    await service.update("k1", { name: "ใหม่" } as never)
    expect(repo.update).toHaveBeenCalledWith("k1", { name: "ใหม่" }, null)
    expect(repo.countFrozenGrades).not.toHaveBeenCalled()
  })

  it("rebuilds the ladder on a scale change and refuses it over frozen grades", async () => {
    const { service, repo } = setup()
    await service.update("k1", { gradeScale: "PASS_FAIL", passCriteria: 70 } as never)
    const [, data, bands] = repo.update.mock.calls[0] as unknown as [string, object, unknown[]]
    expect(data).toMatchObject({ gradeScale: "PASS_FAIL", passCriteria: 70 })
    expect(bands).not.toBeNull()

    repo.countFrozenGrades.mockResolvedValueOnce(2)
    await expect(service.update("k1", { gradeScale: "PASS_FAIL" } as never)).rejects.toThrow(
      "มีเกรดที่ตรึงไว้แล้ว",
    )
  })

  it("moves the S band when only an S/U course's passCriteria changes (CR-06)", async () => {
    const { service, repo } = setup({
      findById: vi.fn(async () => row({ gradeScale: "PASS_FAIL" })),
    })
    await service.update("k1", { passCriteria: 65 } as never)
    expect(repo.setPassBand).toHaveBeenCalledWith("k1", 65)
  })

  it("judges a PATCH of gradeMethod against the stored scale", async () => {
    const { service } = setup({
      findById: vi.fn(async () => row({ gradeScale: "PASS_FAIL" })),
    })
    await expect(
      service.update("k1", { gradeMethod: "NORM_REFERENCED" } as never),
    ).rejects.toBeInstanceOf(BusinessRuleError)
  })
})

describe("remove", () => {
  it("without confirm returns the impact and deletes nothing (FR-26)", async () => {
    const { service, repo } = setup()
    expect(await service.remove("k1", false)).toEqual({ deleted: false, impact: { students: 3 } })
    expect(repo.delete).not.toHaveBeenCalled()
    expect(await service.remove("k1", true)).toEqual({ deleted: true })
    expect(repo.delete).toHaveBeenCalledWith("k1")
  })
})

describe("instructors", () => {
  it("nobody removes themself, and the last teacher stays", async () => {
    const { service, repo } = setup()
    await expect(service.removeInstructor("k1", "u1", instructor)).rejects.toThrow(
      "เอาตัวเองออกจากรายวิชาไม่ได้",
    )
    repo.removeInstructor.mockResolvedValueOnce("missing")
    await expect(service.removeInstructor("k1", "u2", instructor)).rejects.toBeInstanceOf(
      NotFoundError,
    )
    repo.removeInstructor.mockResolvedValueOnce("last")
    await expect(service.removeInstructor("k1", "u2", instructor)).rejects.toThrow("อย่างน้อย 1 คน")
    expect(await service.removeInstructor("k1", "u2", instructor)).toEqual({ removed: true })
  })

  it("adding checks the account, then lists with email", async () => {
    const { service, repo } = setup()
    const r = await service.addInstructor("k1", "u2")
    expect(repo.findUsers).toHaveBeenCalledWith(["u2"])
    expect(r).toEqual([{ userId: "u1", name: "ครู", email: "t@x", assignedAt: new Date(0) }])
  })
})

describe("duplicate", () => {
  it("takes the next free section and keeps the usable teachers plus the caller", async () => {
    const { service, repo } = setup()
    await service.duplicate("k1", { userId: "u7", role: "INSTRUCTOR" })
    const [, opts, ids] = repo.duplicate.mock.calls[0]!
    expect(opts).toEqual({ section: "03" })
    expect(ids).toEqual(["u1", "u7"])
  })

  it("is the foreign-course 404 for a course the caller cannot see", async () => {
    see.canSeeCourse.mockResolvedValueOnce(false)
    const { service, repo } = setup()
    await expect(service.duplicate("k1", instructor)).rejects.toBeInstanceOf(CourseNotFoundError)
    expect(repo.findTree).not.toHaveBeenCalled()
  })

  it("skips every taken section and fills the first gap", async () => {
    const { service, repo } = setup({
      sectionsInUse: vi.fn(async () => ["01", "02", "03", "05"].map((section) => ({ section }))),
    })
    await service.duplicate("k1", instructor)
    expect(repo.duplicate.mock.calls[0]![1]).toEqual({ section: "04" })
  })

  it("stops at Sec 99", async () => {
    const { service } = setup({ findTree: vi.fn(async () => row({ section: "99" })) })
    await expect(service.duplicate("k1", instructor)).rejects.toThrow("Sec ครบ 99")
  })

  it("an admin copy with no usable teacher is refused", async () => {
    const { service } = setup({ findUsers: vi.fn(async () => []) })
    await expect(service.duplicate("k1", admin)).rejects.toThrow("ไม่มีผู้สอนที่ใช้งานได้")
  })
})

describe("copyLevel", () => {
  const pool = [
    // In the plan, level 1 term 1, already opened in the target year.
    { ...row({ id: "p1" }), instructors: [{ userId: "u1" }, { userId: "gone" }] },
    // Not in the plan, but in a level-1 term: an elective.
    { ...row({ id: "e1", code: "99999999", name: "วิชาเลือก" }), instructors: [{ userId: "u1" }] },
    // Not in the plan and in the special term: not offered at all.
    { ...row({ id: "x1", code: "88888888", semester: 3 }), instructors: [{ userId: "u1" }] },
  ]

  it("preview: planned, off-plan and missing, with a note per issue", async () => {
    const { service } = setup({
      yearPool: vi.fn(async () => pool),
      keysInYear: vi.fn(async () => new Set(["03376120|1|01"])),
      findUsers: vi.fn(async () => [okUser("u1")]),
    })
    const r = await service.copyLevelPreview(
      { level: 1, fromYear: 2568, toYear: 2569 } as never,
      instructor,
    )
    expect(r.planned.map((p) => p.courseId)).toEqual(["p1"])
    expect(r.planned[0]!.exists).toBe(true)
    expect(r.planned[0]!.notes.map((n) => n.tone)).toEqual(["nil", "warn"])
    expect(r.offPlan.map((p) => p.courseId)).toEqual(["e1"])
    expect(r.missing.map((m) => m.code)).toContain("03376116")
    expect(r.missing.map((m) => m.code)).not.toContain("03376120")
  })

  it("commit: copies what it can and reports each skip", async () => {
    const trees: Record<string, ReturnType<typeof row>> = {
      a: row({ id: "a", code: "A" }),
      b: row({ id: "b", code: "B" }),
      c: row({ id: "c", code: "C", year: 2500 }),
      d: row({ id: "d", code: "D" }),
    }
    const { service, repo } = setup({
      findTree: vi.fn(async (id: string) => trees[id] ?? null),
      keysInYear: vi.fn(async () => new Set(["B|1|01"])),
      findUsers: vi.fn(async (ids: string[]) => (ids.includes("u1") ? [okUser("u1")] : [])),
    })
    trees.d!.instructors = [{ userId: "nobody", user: { name: "x" } }]
    const r = await service.copyLevelCommit(
      { fromYear: 2568, toYear: 2569, courseIds: ["a", "b", "c", "d", "a"] } as never,
      admin,
    )
    expect(r.created).toEqual([{ fromCourseId: "a", courseId: "copy" }])
    expect(r.skipped).toEqual([
      { courseId: "b", reason: "EXISTS" },
      { courseId: "c", reason: "NO_ACCESS" },
      { courseId: "d", reason: "NO_TEACHER" },
      // The second "a" sees the copy the first one just made.
      { courseId: "a", reason: "EXISTS" },
    ])
    expect(repo.duplicate).toHaveBeenCalledTimes(1)
  })

  it("commit: nothing visible at all is the foreign-course 404", async () => {
    see.canSeeCourse.mockResolvedValue(false)
    const { service } = setup()
    await expect(
      service.copyLevelCommit(
        { fromYear: 2568, toYear: 2569, courseIds: ["a"] } as never,
        instructor,
      ),
    ).rejects.toBeInstanceOf(CourseNotFoundError)
  })
})
