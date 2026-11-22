/**
 * Characterization tests (refactor-plan.md P0): pin GradingService today, so P3 can
 * move CourseDataRepository out of modules/dashboard without changing a grade.
 */
import { describe, expect, it, vi } from "vitest"
import { BusinessRuleError, NotFoundError } from "../../lib/errors.js"
import type {
  CourseDataRepository,
  CourseSnapshot,
} from "../../repositories/course-data.repository.js"
import type { GradingRepository } from "./grading.repository.js"
import { GradingService } from "./grading.service.js"

/**
 * One CLO, two activities (weight 50 each, out of 10), criterion-referenced A–F.
 *   s1  9 + 8 → 85  complete  → A
 *   s2  9 + 3 → 60  complete  → C
 *   s3  nothing scored        → not complete, no grade
 *   s5  2 + 2 → 20  complete  → F
 *   s6  withdrawn
 */
function snapshot(
  over: { course?: Record<string, unknown>; grades?: unknown[]; bands?: unknown[] } = {},
) {
  const course = {
    id: "k1",
    code: "90641001",
    name: "วิชาทดสอบ",
    section: "01",
    semester: 1,
    year: 2569,
    cloPassMark: 60,
    classTarget: 60,
    passCriteria: 50,
    gradeScale: "LETTER",
    gradeMethod: "CRITERION_REFERENCED",
    ...over.course,
  }
  const sc = (studentId: string, activityId: string, score: number) => ({
    studentId,
    activityId,
    score,
    status: "SCORED",
  })
  return {
    course,
    data: {
      course,
      clos: [{ id: "c1", number: 1, description: "", classTarget: null }],
      objectives: [{ id: "o1", cloId: "c1", number: 1, weight: 100 }],
      activities: [
        { id: "a1", name: "Q1", weight: 50, maxScore: 10, closedAt: null, passMark: null },
        { id: "a2", name: "Q2", weight: 50, maxScore: 10, closedAt: null, passMark: null },
      ],
      cells: [
        { activityId: "a1", objectiveId: "o1", weight: 100 },
        { activityId: "a2", objectiveId: "o1", weight: 100 },
      ],
      students: [
        { id: "s1", studentCode: "001", name: "หนึ่ง", status: "ENROLLED" },
        { id: "s2", studentCode: "002", name: "สอง", status: "ENROLLED" },
        { id: "s3", studentCode: "003", name: "สาม", status: "ENROLLED" },
        { id: "s5", studentCode: "005", name: "ห้า", status: "ENROLLED" },
        { id: "s6", studentCode: "006", name: "หก", status: "WITHDRAWN" },
      ],
      scores: [
        sc("s1", "a1", 9),
        sc("s1", "a2", 8),
        sc("s2", "a1", 9),
        sc("s2", "a2", 3),
        sc("s5", "a1", 2),
        sc("s5", "a2", 2),
      ],
    },
    bands: over.bands ?? [
      { grade: "A", minValue: 80 },
      { grade: "B", minValue: 70 },
      { grade: "C", minValue: 60 },
      { grade: "D", minValue: 50 },
      { grade: "F", minValue: 0 },
    ],
    grades: over.grades ?? [],
    plans: [],
    passMarks: new Map(),
  } as unknown as CourseSnapshot
}

function setup(snap: CourseSnapshot = snapshot(), frozen = 0, row: unknown = null) {
  const data = { load: vi.fn(async () => snap) }
  const grading = {
    countFrozen: vi.fn(async () => frozen),
    saveLadder: vi.fn(async () => {}),
    freeze: vi.fn(async () => {}),
    unfreeze: vi.fn(async () => 4),
    findGrade: vi.fn(async () => row as never),
    setGrade: vi.fn(async (_s: string, grade: string, reason: string | null) => ({
      grade,
      overrideReason: reason,
    })),
  }
  const service = new GradingService(
    data as unknown as CourseDataRepository,
    grading as unknown as GradingRepository,
  )
  return { service, data, grading }
}

describe("get", () => {
  it("shows the ladder top-down with edges, counts and the pass floor", async () => {
    const { service } = setup()
    const r = await service.get("k1")
    expect(r).toMatchObject({
      gradeScale: "LETTER",
      gradeMethod: "CRITERION_REFERENCED",
      passCriteria: 50,
      passCriteriaSource: "LADDER",
      frozen: false,
    })
    expect(
      r.bands.map((b) => [b.grade, b.minValue, b.maxValue, b.count, b.isPassFloor, b.isFail]),
    ).toEqual([
      ["A", 80, 100, 1, false, false],
      ["B", 70, 80, 0, false, false],
      ["C", 60, 70, 1, false, false],
      ["D", 50, 60, 0, true, false],
      ["F", 0, 50, 1, false, true],
    ])
  })

  it("lists every student: withdrawn is W, an unfinished one has no total grade", async () => {
    const { service } = setup()
    const r = await service.get("k1")
    expect(
      r.students.map((s) => [
        s.studentCode,
        s.totalPercent,
        s.complete,
        s.derivedGrade,
        s.issuedGrade,
      ]),
    ).toEqual([
      ["001", 85, true, "A", null],
      ["002", 60, true, "C", null],
      ["003", null, false, null, null],
      ["005", 20, true, "F", null],
      ["006", null, false, "W", null],
    ])
  })

  it("once frozen, the issued grade wins over the live one", async () => {
    const snap = snapshot({
      grades: [{ studentId: "s1", totalPercent: 85, grade: "B", overrideReason: "ปรับ" }],
    })
    const r = await setup(snap).service.get("k1")
    expect(r.frozen).toBe(true)
    expect(r.students[0]).toMatchObject({
      derivedGrade: "A",
      issuedGrade: "B",
      overrideReason: "ปรับ",
    })
    expect(r.bands.find((b) => b.grade === "B")!.count).toBe(1)
    expect(r.bands.find((b) => b.grade === "A")!.count).toBe(0)
  })

  it("S/U and norm-referenced courses take a typed pass mark and have no 100 ceiling", async () => {
    const snap = snapshot({
      course: { gradeMethod: "NORM_REFERENCED" },
      bands: [
        { grade: "A", minValue: 1 },
        { grade: "F", minValue: 0 },
      ],
    })
    const r = await setup(snap).service.get("k1")
    expect(r.passCriteriaSource).toBe("MANUAL")
    expect(r.bands[0]!.maxValue).toBeNull()
  })
})

describe("saveBands", () => {
  const ladder = (...b: [string, number][]) => b.map(([grade, minValue]) => ({ grade, minValue }))
  const AF = ladder(["A", 80], ["B", 70], ["C", 60], ["D", 50], ["F", 0])

  it("A–F by criterion derives the pass mark from the lowest passing band", async () => {
    const { service, grading } = setup()
    await service.saveBands("k1", { bands: AF } as never)
    expect(grading.saveLadder).toHaveBeenCalledWith(
      "k1",
      { gradeScale: "LETTER", gradeMethod: "CRITERION_REFERENCED", passCriteria: 50 },
      AF,
    )
  })

  it("S/U: the S band is the pass mark, sent as passCriteria or as the S floor (CR-06)", async () => {
    const { service, grading } = setup()
    await service.saveBands("k1", {
      gradeScale: "PASS_FAIL",
      bands: ladder(["S", 55], ["U", 0]),
    } as never)
    const [, settings, bands] = grading.saveLadder.mock.calls[0] as unknown as [
      string,
      { passCriteria: number },
      { grade: string; minValue: number }[],
    ]
    expect(settings.passCriteria).toBe(55)
    expect(bands).toEqual(ladder(["S", 55], ["U", 0]))
  })

  it("norm-referenced keeps the stored pass mark unless one is sent", async () => {
    const { service, grading } = setup()
    await service.saveBands("k1", {
      gradeMethod: "NORM_REFERENCED",
      bands: ladder(["A", 1], ["F", 0]),
    } as never)
    expect(
      (grading.saveLadder.mock.calls[0] as unknown as [string, { passCriteria: number }])[1]
        .passCriteria,
    ).toBe(50)
  })

  it.each([
    [
      "S/U with norm-referencing",
      { gradeScale: "PASS_FAIL", gradeMethod: "NORM_REFERENCED", bands: AF },
      "ตัดเกรดอิงกลุ่มไม่ได้",
    ],
    [
      "a typed pass mark on A–F criterion",
      { passCriteria: 55, bands: AF },
      "ไม่ต้องส่ง passCriteria",
    ],
    ["a repeated grade", { bands: ladder(["A", 80], ["A", 0]) }, "ชื่อเกรดซ้ำกัน"],
    ["a repeated floor", { bands: ladder(["A", 0], ["F", 0]) }, "คะแนนเริ่มของเกรดซ้ำกัน"],
    ["no band at 0", { bands: ladder(["A", 80], ["F", 10]) }, "ต้องมีเกรดที่เริ่มที่ 0"],
    ["a floor above 100", { bands: ladder(["A", 120], ["F", 0]) }, "ไม่เกิน 100"],
    [
      "S/U with other letters",
      { gradeScale: "PASS_FAIL", bands: ladder(["S", 50], ["F", 0]) },
      "ขั้น S และ U เท่านั้น",
    ],
    [
      "S at 0",
      { gradeScale: "PASS_FAIL", bands: ladder(["S", 0], ["U", 0]) },
      "คะแนนเริ่มของเกรดซ้ำกัน",
    ],
    [
      "S/U passCriteria 0",
      { gradeScale: "PASS_FAIL", passCriteria: 0, bands: ladder(["S", 50], ["U", 0]) },
      "ต้องมากกว่า 0",
    ],
  ])("refuses %s", async (_name, input, message) => {
    const { service, grading } = setup()
    await expect(service.saveBands("k1", input as never)).rejects.toThrow(message)
    expect(grading.saveLadder).not.toHaveBeenCalled()
  })

  it("will not switch scale or method under frozen grades, but may re-cut the same ladder", async () => {
    const { service, grading } = setup(snapshot(), 3)
    await expect(
      service.saveBands("k1", {
        gradeScale: "PASS_FAIL",
        bands: ladder(["S", 50], ["U", 0]),
      } as never),
    ).rejects.toThrow("มีเกรดที่ตรึงไว้แล้ว")
    await service.saveBands("k1", { bands: AF } as never)
    expect(grading.saveLadder).toHaveBeenCalledTimes(1)
  })
})

describe("run (CR-11)", () => {
  it("freezes the grades of everyone who has one and counts the rest as skipped", async () => {
    const { service, grading } = setup()
    const r = await service.run("k1")
    expect(grading.freeze).toHaveBeenCalledWith("k1", [
      { studentId: "s1", totalPercent: 85, grade: "A" },
      { studentId: "s2", totalPercent: 60, grade: "C" },
      { studentId: "s5", totalPercent: 20, grade: "F" },
    ])
    expect(r).toMatchObject({ issued: 3, skipped: 1 })
  })
})

describe("unfreeze", () => {
  it("needs something frozen, and needs confirm because overrides go too", async () => {
    await expect(setup(snapshot(), 0).service.unfreeze("k1", true)).rejects.toThrow(
      "ยังไม่ได้ตรึงเกรด",
    )
    const { service, grading } = setup(snapshot(), 3)
    await expect(service.unfreeze("k1", false)).rejects.toThrow("ส่ง ?confirm=true")
    expect(grading.unfreeze).not.toHaveBeenCalled()
    expect(await service.unfreeze("k1", true)).toEqual({ unfrozen: 4 })
  })
})

describe("override", () => {
  const frozenRow = { totalPercent: 60, overrideReason: null }

  it("needs a frozen grade first", async () => {
    await expect(setup().service.override("k1", "s2", "B", "เหตุผล")).rejects.toThrow(
      "กดตัดเกรดก่อน",
    )
  })

  it("sets a grade on the ladder and reports the live one beside it", async () => {
    const { service, grading } = setup(snapshot(), 1, frozenRow)
    const r = await service.override("k1", "s2", "B", "งานชดเชย")
    expect(grading.setGrade).toHaveBeenCalledWith("s2", "B", "งานชดเชย")
    expect(r).toEqual({
      studentId: "s2",
      derivedGrade: "C",
      issuedGrade: "B",
      overrideReason: "งานชดเชย",
    })
  })

  it("refuses a grade that is not on the ladder, and a withdrawn student", async () => {
    const { service } = setup(snapshot(), 1, frozenRow)
    await expect(service.override("k1", "s2", "A+", "x")).rejects.toThrow("ไม่มีเกรด A+")
    await expect(service.override("k1", "s6", "A", "x")).rejects.toThrow("ถอนรายวิชาแล้ว")
  })

  it("an S/U course may only be S or U", async () => {
    const snap = snapshot({
      course: { gradeScale: "PASS_FAIL" },
      bands: [
        { grade: "S", minValue: 50 },
        { grade: "U", minValue: 0 },
      ],
    })
    const { service } = setup(snap, 1, frozenRow)
    await expect(service.override("k1", "s2", "A", "x")).rejects.toThrow("ไม่มีเกรด A")
    await expect(service.override("k1", "s2", "S", "x")).resolves.toMatchObject({
      issuedGrade: "S",
    })
  })
})

describe("clearOverride", () => {
  const overridden = { totalPercent: 60, overrideReason: "ปรับ" }

  it("is a 404 when there is nothing to clear", async () => {
    const { service } = setup(snapshot(), 1, { totalPercent: 60, overrideReason: null })
    await expect(service.clearOverride("k1", "s2")).rejects.toBeInstanceOf(NotFoundError)
  })

  it("criterion: back to the band of the STORED total, even if scores moved since", async () => {
    const { service, grading } = setup(snapshot(), 1, { totalPercent: 72, overrideReason: "ปรับ" })
    const r = await service.clearOverride("k1", "s2")
    expect(grading.setGrade).toHaveBeenCalledWith("s2", "B", null)
    expect(r).toEqual({
      studentId: "s2",
      derivedGrade: "B",
      issuedGrade: "B",
      overrideReason: null,
    })
  })

  it("S/U: compares the stored total with the pass mark", async () => {
    const snap = snapshot({ course: { gradeScale: "PASS_FAIL", passCriteria: 50 } })
    const pass = setup(snap, 1, overridden)
    expect((await pass.service.clearOverride("k1", "s2")).issuedGrade).toBe("S")
    const fail = setup(snap, 1, { totalPercent: 49, overrideReason: "ปรับ" })
    expect((await fail.service.clearOverride("k1", "s2")).issuedGrade).toBe("U")
  })

  it("norm-referenced: back to today's cohort grade, or refuses when there is none", async () => {
    const snap = snapshot({
      course: { gradeMethod: "NORM_REFERENCED" },
      bands: [
        { grade: "A", minValue: 1 },
        { grade: "F", minValue: 0 },
      ],
    })
    const { service } = setup(snap, 1, overridden)
    await expect(service.clearOverride("k1", "s3")).rejects.toBeInstanceOf(BusinessRuleError)
  })
})

describe("saveBands: S/U passCriteria wins over the S floor", () => {
  it("rewrites the S band to the typed pass mark so the two cannot drift (CR-06)", async () => {
    const { service, grading } = setup()
    await service.saveBands("k1", {
      gradeScale: "PASS_FAIL",
      passCriteria: 65,
      bands: [
        { grade: "S", minValue: 55 },
        { grade: "U", minValue: 0 },
      ],
    } as never)
    const [, settings, bands] = grading.saveLadder.mock.calls[0] as unknown as [
      string,
      { passCriteria: number },
      { grade: string; minValue: number }[],
    ]
    expect(settings.passCriteria).toBe(65)
    expect(bands.find((b) => b.grade === "S")!.minValue).toBe(65)
  })
})
