import { describe, expect, it } from "vitest"
import {
  analyse,
  bandFor,
  blockers,
  cloAttainment,
  computeGrades,
  type CourseData,
} from "./attainment.js"

const LADDER = [
  { grade: "A", minValue: 80 },
  { grade: "B", minValue: 70 },
  { grade: "C", minValue: 60 },
  { grade: "D", minValue: 50 },
  { grade: "F", minValue: 0 },
]

/** One CLO, one objective, two activities A1 (weight 30) and A2 (weight 70), both fully on the objective. */
function course(scores: CourseData["scores"], extra: Partial<CourseData> = {}): CourseData {
  return {
    course: {
      cloPassMark: 60,
      classTarget: 100,
      passCriteria: 50,
      gradeScale: "LETTER",
      gradeMethod: "CRITERION_REFERENCED",
    },
    clos: [{ id: "c1", number: 1, description: "", classTarget: null }],
    objectives: [{ id: "o1", cloId: "c1", number: 1, weight: 100 }],
    activities: [
      { id: "a1", name: "A1", weight: 30, maxScore: 10, closedAt: null },
      { id: "a2", name: "A2", weight: 70, maxScore: 50, closedAt: null },
    ],
    cells: [
      { activityId: "a1", objectiveId: "o1", weight: 100 },
      { activityId: "a2", objectiveId: "o1", weight: 100 },
    ],
    students: [
      { id: "s1", studentCode: "1", name: "one", status: "ENROLLED" },
      { id: "s2", studentCode: "2", name: "two", status: "ENROLLED" },
    ],
    scores,
    ...extra,
  }
}

describe("CR-03 — weighted by Activity.weight (OI-10)", () => {
  it("A1 (30, 100%) + A2 (70, 0%) is 30%, not 50%", () => {
    const d = course([
      { studentId: "s1", activityId: "a1", score: 10, status: "SCORED" },
      { studentId: "s1", activityId: "a2", score: 0, status: "SCORED" },
    ])
    const r = analyse(d).results[0]!
    expect(r.clos.get("c1")!.score).toBeCloseTo(30, 10)
    expect(r.totalScore).toBeCloseTo(30, 10)
    expect(r.clos.get("c1")!.status).toBe("AT_RISK")
  })

  it("a student with no score is NOT_EVALUATED, never at-risk (CR-03.1)", () => {
    const a = analyse(course([]))
    expect(a.results[1]!.clos.get("c1")!.status).toBe("NOT_EVALUATED")
    expect(a.results[1]!.totalScore).toBeNull()
  })

  it("an excused activity leaves both sides of the fraction (CR-05.1)", () => {
    const r = analyse(
      course([
        { studentId: "s1", activityId: "a1", score: null, status: "EXCUSED" },
        { studentId: "s1", activityId: "a2", score: 40, status: "SCORED" },
      ]),
    ).results[0]!
    expect(r.totalScore).toBeCloseTo(80, 10)
    expect(r.complete).toBe(true)
    expect(r.coursePassed).toBe(true)
  })

  it("marks a CLO score provisional while some of its activities are missing", () => {
    const r = analyse(course([{ studentId: "s1", activityId: "a1", score: 10, status: "SCORED" }]))
      .results[0]!
    expect(r.clos.get("c1")).toMatchObject({ score: 100, status: "PASS", provisional: true })
    expect(r.complete).toBe(false)
    expect(r.coursePassed).toBeNull() // FR-62: not "ไม่ผ่าน" until complete
  })

  it("lists a closed activity with no row as overdue", () => {
    const d = course([{ studentId: "s1", activityId: "a1", score: 5, status: "SCORED" }])
    d.activities[1]!.closedAt = new Date()
    expect(analyse(d).results[0]!.overdue).toEqual(["a2"])
  })
})

describe("CR-04 — attainment", () => {
  it("counts only evaluable, enrolled students", () => {
    const d = course(
      [
        { studentId: "s1", activityId: "a1", score: 10, status: "SCORED" },
        { studentId: "s1", activityId: "a2", score: 50, status: "SCORED" },
        { studentId: "s3", activityId: "a1", score: 0, status: "SCORED" },
      ],
      {
        students: [
          { id: "s1", studentCode: "1", name: "one", status: "ENROLLED" },
          { id: "s2", studentCode: "2", name: "two", status: "ENROLLED" },
          { id: "s3", studentCode: "3", name: "gone", status: "WITHDRAWN" },
        ],
      },
    )
    const [c] = cloAttainment(d, analyse(d))
    expect(c).toMatchObject({
      attainment: 100,
      passedCount: 1,
      evaluableCount: 1,
      notEvaluatedCount: 1,
    })
  })

  it("is null with a reason when the weights do not add up (FR-84)", () => {
    const d = course([{ studentId: "s1", activityId: "a1", score: 10, status: "SCORED" }])
    d.activities[1]!.weight = 60
    expect(blockers(d)).toContain("สัดส่วนกิจกรรมรวม 90% ยังไม่เป็น 100%")
    expect(cloAttainment(d, analyse(d))[0]!.attainment).toBeNull()
  })
})

describe("grading", () => {
  const full = (s: string, a1: number, a2: number): CourseData["scores"] => [
    { studentId: s, activityId: "a1", score: a1, status: "SCORED" },
    { studentId: s, activityId: "a2", score: a2, status: "SCORED" },
  ]

  it("CR-09 picks the highest band at or below the total", () => {
    expect(bandFor(LADDER, 79.99)).toBe("B")
    expect(bandFor(LADDER, 80)).toBe("A")
    const d = course([...full("s1", 10, 40), ...full("s2", 5, 25)])
    const g = computeGrades(d, analyse(d), LADDER)
    expect(g.grades.get("s1")).toMatchObject({ grade: "A", totalPercent: 86 })
    expect(g.grades.get("s2")).toMatchObject({ grade: "D", totalPercent: 50 })
  })

  it("CR-10 uses the population SD (n, not n − 1) and a linear T", () => {
    const d = course([...full("s1", 10, 40), ...full("s2", 5, 25)])
    d.course.gradeMethod = "NORM_REFERENCED"
    const T = [
      { grade: "A", minValue: 55 },
      { grade: "B", minValue: 45 },
      { grade: "F", minValue: 0 },
    ]
    const g = computeGrades(d, analyse(d), T)
    expect(g.stats).toEqual({ n: 2, mean: 68, sd: 18 }) // totals 86 and 50
    expect(g.grades.get("s1")!.t).toBeCloseTo(60, 10)
    expect(g.grades.get("s2")!.t).toBeCloseTo(40, 10)
    expect(g.grades.get("s1")!.grade).toBe("A")
  })

  it("refuses a curve with SD = 0 and fewer than 2 students (CR-10)", () => {
    const same = course([...full("s1", 10, 40), ...full("s2", 10, 40)])
    same.course.gradeMethod = "NORM_REFERENCED"
    expect(computeGrades(same, analyse(same), LADDER).refusals[0]).toContain("SD = 0")
    const one = course(full("s1", 10, 40))
    one.course.gradeMethod = "NORM_REFERENCED"
    expect(computeGrades(one, analyse(one), LADDER).refusals[0]).toContain("อย่างน้อย 2 คน")
  })

  it("PASS_FAIL issues S or U from passCriteria only (CR-06)", () => {
    const d = course([...full("s1", 10, 40), ...full("s2", 2, 10)])
    d.course.gradeScale = "PASS_FAIL"
    d.course.passCriteria = 60
    const g = computeGrades(d, analyse(d), [])
    expect(g.grades.get("s1")!.grade).toBe("S")
    expect(g.grades.get("s2")!.grade).toBe("U")
  })

  it("issues no grade to an incomplete student, and says so", () => {
    const d = course([
      ...full("s1", 10, 40),
      { studentId: "s2", activityId: "a1", score: 5, status: "SCORED" },
    ])
    const g = computeGrades(d, analyse(d), LADDER)
    expect(g.grades.has("s2")).toBe(false)
    expect(g.warnings).toContain("นักศึกษา 1 คนคะแนนยังไม่ครบ จะยังไม่ได้เกรด")
  })
})
