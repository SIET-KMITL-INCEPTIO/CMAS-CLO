/**
 * Characterization tests (refactor-plan.md P0): pin what DashboardService returns
 * today, so P3 can split the file without changing a number on any screen.
 */
import * as XLSX from "xlsx"
import { describe, expect, it, vi } from "vitest"
import { NotFoundError } from "../../lib/errors.js"
import type {
  CourseDataRepository,
  CourseSnapshot,
} from "../../repositories/course-data.repository.js"
import { DashboardService } from "./dashboard.service.js"

/**
 * Two CLOs, each measured by one activity (weight 50, out of 10).
 *   s1  9 / 8  → 90 / 80, total 85: passes everything
 *   s2  9 / 3  → 90 / 30, total 60: course passes, CLO 2 below the 60 mark
 *   s3  —      → nothing scored: NOT_EVALUATED, never at risk
 *   s5  2 / 2  → 20 / 20, total 20: fails the course
 *   s6  withdrawn
 */
function snapshot(over: Partial<CourseSnapshot["course"]> = {}): CourseSnapshot {
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
    gradeScale: "LETTER" as const,
    gradeMethod: "CRITERION_REFERENCED" as const,
    ...over,
  }
  const activities = [
    { id: "a1", name: "Quiz 1", weight: 50, maxScore: 10, closedAt: null, passMark: null },
    { id: "a2", name: "Quiz 2", weight: 50, maxScore: 10, closedAt: null, passMark: null },
  ]
  const sc = (studentId: string, activityId: string, score: number) => ({
    studentId,
    activityId,
    score,
    status: "SCORED" as const,
  })
  const data = {
    course,
    clos: [
      { id: "c1", number: 1, description: "อธิบาย 1", classTarget: null },
      { id: "c2", number: 2, description: "อธิบาย 2", classTarget: null },
    ],
    objectives: [
      { id: "o1", cloId: "c1", number: 1, weight: 100 },
      { id: "o2", cloId: "c2", number: 1, weight: 100 },
    ],
    activities,
    cells: [
      { activityId: "a1", objectiveId: "o1", weight: 100 },
      { activityId: "a2", objectiveId: "o2", weight: 100 },
    ],
    students: [
      { id: "s1", studentCode: "001", name: "หนึ่ง", status: "ENROLLED" as const },
      { id: "s2", studentCode: "002", name: "สอง", status: "ENROLLED" as const },
      { id: "s3", studentCode: "003", name: "สาม", status: "ENROLLED" as const },
      { id: "s5", studentCode: "005", name: "ห้า", status: "ENROLLED" as const },
      { id: "s6", studentCode: "006", name: "หก", status: "WITHDRAWN" as const },
    ],
    scores: [
      sc("s1", "a1", 9),
      sc("s1", "a2", 8),
      sc("s2", "a1", 9),
      sc("s2", "a2", 3),
      sc("s5", "a1", 2),
      sc("s5", "a2", 2),
    ],
  }
  return {
    course,
    data,
    bands: [
      { grade: "A", minValue: 80 },
      { grade: "B", minValue: 70 },
      { grade: "C", minValue: 60 },
      { grade: "D", minValue: 50 },
      { grade: "F", minValue: 0 },
    ],
    grades: [],
    plans: [{ studentId: "s2", cloId: "c2", plan: "ทำแบบฝึกเพิ่ม", updatedAt: new Date(0) }],
    passMarks: new Map(activities.map((x) => [x.id, x.passMark])),
  } as unknown as CourseSnapshot
}

function setup(snap: CourseSnapshot = snapshot(), ids = ["k1"]) {
  const data = {
    load: vi.fn(async () => snap),
    visibleCourseIds: vi.fn(async () => ids),
  }
  return { service: new DashboardService(data as unknown as CourseDataRepository), data }
}

const sheetsOf = (buf: Buffer) => XLSX.read(buf, { type: "buffer" })
const rowsOf = (wb: XLSX.WorkBook, name: string) =>
  XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name]!, { header: 1, defval: null })

describe("overview", () => {
  it("sums students, achieved CLOs and score progress over every visible course", async () => {
    const { service, data } = setup(snapshot(), ["k1", "k2"])
    const r = await service.overview({ userId: "u1", role: "INSTRUCTOR" } as never)
    expect(data.load).toHaveBeenCalledTimes(2)
    expect(r).toEqual({
      courseCount: 2,
      studentCount: 8,
      cloCompleted: 2,
      cloTotal: 4,
      scoreProgress: { scored: 12, expected: 16 },
    })
  })

  it("is all zeros when the caller sees no course", async () => {
    const { service, data } = setup(snapshot(), [])
    const r = await service.overview({ userId: "u1", role: "INSTRUCTOR" } as never)
    expect(data.load).not.toHaveBeenCalled()
    expect(r.courseCount).toBe(0)
    expect(r.scoreProgress).toEqual({ scored: 0, expected: 0 })
  })
})

describe("attainment", () => {
  it("reports per-CLO attainment, the help count and the teaching signal", async () => {
    const { service } = setup()
    const r = await service.attainment("k1")
    expect(r.data.helpCount).toBe(2)
    const [c1, c2] = r.data.clos
    expect(c1).toMatchObject({ cloId: "c1", passedCount: 2, evaluableCount: 3, attainment: 66.67 })
    expect(c2).toMatchObject({ cloId: "c2", passedCount: 1, evaluableCount: 3, attainment: 33.33 })
    expect(c1!.status).toBe("ACHIEVED")
    expect(c2!.status).not.toBe("ACHIEVED")
    // More than half the evaluable class fails CLO 2: a teaching signal.
    expect(r.meta).toMatchObject({ computable: true, blockers: [], teachingSignals: ["c2"] })
  })
})

describe("atRisk", () => {
  it("lists a course fail before a CLO below the mark, and never the unscored", async () => {
    const { service } = setup()
    const r = await service.atRisk("k1")
    expect(r.data.map((x) => [x.studentId, x.level])).toEqual([
      ["s5", "COURSE_FAIL"],
      ["s2", "CLO_BELOW"],
    ])
    expect(r.meta).toEqual({ atRiskCount: 2, notEvaluatedCount: 1, evaluatedCount: 3 })
  })

  it("gives the gap to the CLO mark, whether it is near, and whether a plan exists", async () => {
    const { service } = setup()
    const s2 = (await service.atRisk("k1")).data.find((x) => x.studentId === "s2")!
    expect(s2.failedClos).toEqual([
      {
        cloId: "c2",
        number: 2,
        score: 30,
        gap: 30,
        near: false,
        provisional: false,
        hasPlan: true,
      },
    ])
    expect(s2.totalScore).toBe(60)
    expect(s2.coursePassed).toBe(true)
  })
})

describe("summary", () => {
  it("counts only complete totals, so a missing score is not a 0 (FR-84)", async () => {
    const { service } = setup()
    const r = await service.summary("k1")
    expect(r.course).toMatchObject({
      passCriteria: 50,
      enrolledCount: 4,
      completeCount: 3,
      passedCount: 2,
      totals: [85, 60, 20],
    })
    expect(r.activities.map((x) => x.averagePercent)).toEqual([66.67, 43.33])
  })

  it("loads the course once for all four parts", async () => {
    const { service, data } = setup()
    const r = await service.summary("k1")
    expect(data.load).toHaveBeenCalledTimes(1)
    expect(r.attainment).toEqual(await service.attainment("k1"))
    expect(r.atRisk).toEqual(await service.atRisk("k1"))
  })
})

describe("classResults", () => {
  it("returns every enrolled student with raw points beside each percent", async () => {
    const { service } = setup()
    const r = await service.classResults("k1")
    expect(r.map((x) => x.studentId)).toEqual(["s1", "s2", "s3", "s5"])
    expect(r[1]!.clos[1]).toEqual({
      cloId: "c2",
      score: 30,
      status: "AT_RISK",
      provisional: false,
      raw: { earned: 3, maxScored: 10, maxAll: 10, missing: 0 },
    })
    expect(r[2]!.clos[0]).toMatchObject({ score: null, status: "NOT_EVALUATED" })
    expect(r[2]!.totalScore).toBeNull()
  })
})

describe("student", () => {
  it("shows CLO, objective and activity detail for one student", async () => {
    const { service } = setup()
    const r = await service.student("k1", "s2")
    expect(r.student).toEqual({ id: "s2", studentCode: "002", name: "สอง", status: "ENROLLED" })
    expect(r.clos.map((c) => [c.number, c.score, c.status])).toEqual([
      [1, 90, "PASS"],
      [2, 30, "AT_RISK"],
    ])
    expect(r.clos[1]!.objectives).toEqual([
      { objectiveId: "o2", label: "2.1", weight: 100, score: 30 },
    ])
    expect(r.activities[1]).toEqual({
      activityId: "a2",
      name: "Quiz 2",
      weight: 50,
      maxScore: 10,
      score: 3,
      percent: 30,
      status: "SCORED",
    })
    expect(r).toMatchObject({ totalScore: 60, coursePassed: true, passFailResult: null })
    // LETTER with nothing issued yet: no grade, not a computed one.
    expect(r.grade).toBeNull()
    expect(r.remediationPlans).toEqual([
      { cloId: "c2", plan: "ทำแบบฝึกเพิ่ม", updatedAt: new Date(0) },
    ])
  })

  it("marks an unscored activity MISSING", async () => {
    const { service } = setup()
    const r = await service.student("k1", "s3")
    expect(r.activities.map((x) => x.status)).toEqual(["MISSING", "MISSING"])
    expect(r.activities[0]!.percent).toBeNull()
  })

  it("gives a withdrawn student W", async () => {
    const { service } = setup()
    expect((await service.student("k1", "s6")).grade).toBe("W")
  })

  it("gives S/U and no letter on a PASS_FAIL course (CR-06)", async () => {
    const { service } = setup(snapshot({ gradeScale: "PASS_FAIL" as never }))
    expect(await service.student("k1", "s1")).toMatchObject({ passFailResult: "S", grade: null })
    expect(await service.student("k1", "s5")).toMatchObject({ passFailResult: "U", grade: null })
  })

  it("is a 404 for a student not in the course", async () => {
    const { service } = setup()
    await expect(service.student("k1", "nobody")).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe("exports", () => {
  it("scores: raw, clo or both sheets, named after the course", async () => {
    const { service } = setup()
    const raw = await service.scoresExport("k1", "raw")
    expect(raw.fileName).toMatch(/^scores-90641001-01-\d{12}\.xlsx$/)
    expect(sheetsOf(raw.buffer).SheetNames).toEqual(["คะแนนดิบ"])
    expect(sheetsOf((await service.scoresExport("k1", "clo")).buffer).SheetNames).toEqual([
      "คะแนนราย CLO",
    ])
    expect(sheetsOf((await service.scoresExport("k1", "both")).buffer).SheetNames).toEqual([
      "คะแนนดิบ",
      "คะแนนราย CLO",
    ])
  })

  it("scores raw sheet: one row per student including the withdrawn, marked ถอน", async () => {
    const { service } = setup()
    const wb = sheetsOf((await service.scoresExport("k1", "raw")).buffer)
    const rows = rowsOf(wb, "คะแนนดิบ").filter((r) => r.includes("006"))
    expect(rows).toHaveLength(1)
    expect(rows[0]).toContain("ถอน")
  })

  it("grades: summary, need-help and grade sheets; live grades before anything is issued", async () => {
    const { service } = setup()
    const out = await service.gradesExport("k1")
    expect(out.fileName).toMatch(/^grades-90641001-01-\d{12}\.xlsx$/)
    const wb = sheetsOf(out.buffer)
    expect(wb.SheetNames).toEqual(["สรุปราย CLO", "ยังไม่ผ่านราย CLO", "เกรด"])
    const grades = rowsOf(wb, "เกรด")
    const gradeOf = (code: string) => grades.find((r) => r.includes(code))?.[3]
    expect(gradeOf("001")).toBe("A")
    expect(gradeOf("003")).toBe("ยังประเมินไม่ครบ")
    expect(gradeOf("006")).toBe("W")
    const help = rowsOf(wb, "ยังไม่ผ่านราย CLO")
    expect(help.find((r) => r.includes("002"))).toContain("ทำแบบฝึกเพิ่ม")
  })

  it("dashboard: the course scope has summary, CLO and need-help sheets", async () => {
    const { service } = setup()
    const out = await service.dashboardExport("k1", "course")
    expect(out.fileName).toMatch(/^dashboard-90641001-01-\d{12}\.xlsx$/)
    expect(sheetsOf(out.buffer).SheetNames).toEqual([
      "สรุปราย CLO",
      "คะแนนราย CLO",
      "ยังไม่ผ่านราย CLO",
    ])
  })

  it("dashboard: the student scope is one sheet for that student", async () => {
    const { service } = setup()
    const out = await service.dashboardExport("k1", "student", "s2")
    expect(out.fileName).toMatch(/^student-002-\d{12}\.xlsx$/)
    const wb = sheetsOf(out.buffer)
    expect(wb.SheetNames).toEqual(["รายบุคคล"])
    expect(rowsOf(wb, "รายบุคคล").find((r) => r.includes("CLO 2"))).toContain("ทำแบบฝึกเพิ่ม")
  })
})
