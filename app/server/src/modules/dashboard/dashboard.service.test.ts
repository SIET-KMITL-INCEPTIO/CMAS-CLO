/**
 * Characterization tests (refactor-plan.md P0): pin what DashboardService returns
 * today, so P3 can split the file without changing a number on any screen.
 */
import { describe, expect, it } from "vitest"
import { NotFoundError } from "../../lib/errors.js"
import { setup, snapshot } from "./dashboard.fixtures.js"

describe("overview", () => {
  it("sums students, achieved CLOs and score progress over every visible course", async () => {
    const { service, data } = setup(snapshot(), ["k1", "k2"])
    const r = await service.overview({ userId: "u1", role: "INSTRUCTOR" } as never)
    // G4: one batch for every course, never a load per course.
    expect(data.loadMany).toHaveBeenCalledExactlyOnceWith(["k1", "k2"])
    expect(data.load).not.toHaveBeenCalled()
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
    expect(r.studentCount).toBe(0)
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

  it("says whether each total is final and how much of the course it rests on (#33)", async () => {
    const snap = snapshot()
    // s5 has a1 only: half the course assessed, so the total is not final yet.
    snap.data.scores = snap.data.scores.filter(
      (x) => !(x.studentId === "s5" && x.activityId === "a2"),
    )
    const { service } = setup(snap)
    const r = new Map((await service.classResults("k1")).map((x) => [x.studentId, x]))
    expect(r.get("s1")).toMatchObject({ complete: true, assessedWeight: 100, coursePassed: true })
    expect(r.get("s2")).toMatchObject({ complete: true, assessedWeight: 100 })
    expect(r.get("s5")).toMatchObject({
      totalScore: 20,
      complete: false,
      coursePassed: null,
      assessedWeight: 50,
    })
    expect(r.get("s3")).toMatchObject({
      totalScore: null,
      complete: false,
      coursePassed: null,
      assessedWeight: 0,
    })
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
