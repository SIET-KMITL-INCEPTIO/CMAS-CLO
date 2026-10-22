/**
 * FR-88: every number the dashboard, the grading page and the exports show
 * comes from here, and only from here (SRS CR-03 … CR-10). Pure functions over
 * one course's rows, so every rule is unit-tested without a database.
 *
 * CR-07: full float precision throughout; rounding happens only on display.
 * CR-08: CLO attainment and pass/fail are criterion-referenced, always. The
 * cohort statistics of norm-referenced grading never reach them.
 */
import { near } from "./weights.js"

export type CourseIn = {
  cloPassMark: number
  classTarget: number
  passCriteria: number
  gradeScale: "LETTER" | "PASS_FAIL"
  gradeMethod: "CRITERION_REFERENCED" | "NORM_REFERENCED"
}
export type CloIn = { id: string; number: number; description: string; classTarget: number | null }
export type ObjectiveIn = { id: string; cloId: string; number: number; weight: number | null }
export type ActivityIn = {
  id: string
  name: string
  weight: number
  maxScore: number
  closedAt: Date | null
}
export type CellIn = { activityId: string; objectiveId: string; weight: number }
export type StudentIn = {
  id: string
  studentCode: string
  name: string
  status: "ENROLLED" | "WITHDRAWN"
}
export type ScoreIn = {
  studentId: string
  activityId: string
  score: number | null
  status: "SCORED" | "EXCUSED"
}

export type CourseData = {
  course: CourseIn
  clos: CloIn[]
  objectives: ObjectiveIn[]
  activities: ActivityIn[]
  cells: CellIn[]
  students: StudentIn[]
  scores: ScoreIn[]
}

/** CR-03.1: three states, never two. */
export type CloStatus = "PASS" | "AT_RISK" | "NOT_EVALUATED"
/** CR-05.1: how far from the pass mark still counts as "ใกล้ผ่าน". */
export const NEAR_GAP = 10
/** Norm-referenced grading on fewer students than this warns (CR-10), it does not block. */
export const MIN_SAMPLE_SIZE = 30

export type StudentResult = {
  student: StudentIn
  objectives: Map<string, number | null>
  clos: Map<string, { score: number | null; status: CloStatus; provisional: boolean }>
  /** CR-05, renormalised over the activities that count for this student (EXCUSED leaves both sides). */
  totalScore: number | null
  /** Every activity with weight > 0 has a row (a score or EXCUSED) for this student (CR-05). */
  complete: boolean
  coursePassed: boolean | null
  /** Closed activities (weight > 0) with no row: "ขาดส่ง" (CR-05.1). */
  overdue: string[]
}

type Cell = { ratio: number } | { excused: true }

export function analyse(d: CourseData) {
  const counted = d.activities.filter((a) => a.weight > 0) // CR-05: weight 0 is not in any formula yet
  const activity = new Map(d.activities.map((a) => [a.id, a]))
  const cellsByObjective = new Map<string, CellIn[]>()
  for (const c of d.cells)
    cellsByObjective.set(c.objectiveId, [...(cellsByObjective.get(c.objectiveId) ?? []), c])
  const objectivesByClo = new Map<string, ObjectiveIn[]>()
  for (const o of d.objectives)
    objectivesByClo.set(o.cloId, [...(objectivesByClo.get(o.cloId) ?? []), o])
  const activitiesOfClo = new Map<string, Set<string>>()
  for (const o of d.objectives) {
    const set = activitiesOfClo.get(o.cloId) ?? new Set<string>()
    for (const c of cellsByObjective.get(o.id) ?? [])
      if ((activity.get(c.activityId)?.weight ?? 0) > 0) set.add(c.activityId)
    activitiesOfClo.set(o.cloId, set)
  }

  const scoreOf = new Map<string, Cell>()
  for (const s of d.scores) {
    const a = activity.get(s.activityId)
    if (!a) continue
    scoreOf.set(
      `${s.studentId}|${s.activityId}`,
      s.status === "EXCUSED" || s.score === null
        ? { excused: true }
        : { ratio: s.score / a.maxScore },
    )
  }

  const results: StudentResult[] = d.students.map((student) => {
    const cell = (activityId: string) => scoreOf.get(`${student.id}|${activityId}`)

    // CR-03 layer 1 — objective score, weighted by Activity.weight × Criteria.weight.
    const objectives = new Map<string, number | null>()
    for (const o of d.objectives) {
      let num = 0
      let den = 0
      for (const c of cellsByObjective.get(o.id) ?? []) {
        const a = activity.get(c.activityId)
        const v = cell(c.activityId)
        if (!a || a.weight <= 0 || !v || "excused" in v) continue
        num += v.ratio * a.weight * c.weight
        den += a.weight * c.weight
      }
      objectives.set(o.id, den > 0 ? (num / den) * 100 : null)
    }

    // CR-03 layer 2 — CLO score over the objectives that have one.
    const clos = new Map<
      string,
      { score: number | null; status: CloStatus; provisional: boolean }
    >()
    for (const c of d.clos) {
      let num = 0
      let den = 0
      for (const o of objectivesByClo.get(c.id) ?? []) {
        const v = objectives.get(o.id)
        if (v === null || v === undefined) continue
        num += v * (o.weight ?? 0)
        den += o.weight ?? 0
      }
      const score = den > 0 ? num / den : null
      const status: CloStatus =
        score === null ? "NOT_EVALUATED" : score >= d.course.cloPassMark ? "PASS" : "AT_RISK"
      const provisional =
        score !== null && [...(activitiesOfClo.get(c.id) ?? [])].some((a) => cell(a) === undefined)
      clos.set(c.id, { score, status, provisional })
    }

    // CR-05 — total over the activities that count for this student.
    let num = 0
    let den = 0
    let complete = true
    const overdue: string[] = []
    for (const a of counted) {
      const v = cell(a.id)
      if (!v) {
        complete = false
        if (a.closedAt) overdue.push(a.id)
        continue
      }
      if ("excused" in v) continue
      num += v.ratio * a.weight
      den += a.weight
    }
    // Nothing scored (or everything excused) is no total at all, not a 0.
    const totalScore = den > 0 ? (num / den) * 100 : null
    const coursePassed =
      complete && totalScore !== null ? totalScore >= d.course.passCriteria : null

    return { student, objectives, clos, totalScore, complete, coursePassed, overdue }
  })

  const enrolled = results.filter((r) => r.student.status === "ENROLLED") // R2: withdrawn leave every denominator

  return { results, enrolled, blockers: blockers(d), counted }
}

/** FR-84: why the course's numbers cannot be trusted yet. Empty = computable. */
export function blockers(d: CourseData): string[] {
  const out: string[] = []
  if (d.activities.length === 0) out.push("ยังไม่มีกิจกรรม")
  const total = d.activities.reduce((s, a) => s + a.weight, 0)
  if (d.activities.length && !near(total, 100))
    out.push(`สัดส่วนกิจกรรมรวม ${round(total)}% ยังไม่เป็น 100%`)
  for (const a of d.activities.filter((x) => x.weight > 0)) {
    const sum = d.cells.filter((c) => c.activityId === a.id).reduce((s, c) => s + c.weight, 0)
    if (!near(sum, 100)) out.push(`${a.name}: ผูกจุดประสงค์รวม ${round(sum)}% ยังไม่เป็น 100%`)
  }
  for (const c of d.clos) {
    const objs = d.objectives.filter((o) => o.cloId === c.id)
    if (objs.length === 0) out.push(`CLO ${c.number}: ยังไม่มีจุดประสงค์`)
    else if (
      !near(
        objs.reduce((s, o) => s + (o.weight ?? 0), 0),
        100,
      )
    ) {
      out.push(`CLO ${c.number}: น้ำหนักจุดประสงค์รวมยังไม่เป็น 100%`)
    }
  }
  if (d.clos.length === 0) out.push("ยังไม่มี CLO")
  return out
}

/** CR-04 per CLO, over enrolled students with a score for it. */
export function cloAttainment(d: CourseData, a: ReturnType<typeof analyse>) {
  const computable = a.blockers.length === 0
  return d.clos.map((c) => {
    const rows = a.enrolled.map((r) => r.clos.get(c.id)!)
    const evaluable = rows.filter((r) => r.status !== "NOT_EVALUATED")
    const passed = evaluable.filter((r) => r.status === "PASS").length
    const target = c.classTarget ?? d.course.classTarget
    // FR-84: not enough data is null with a reason, never a 0 that reads as "everyone failed".
    const attainment = computable && evaluable.length > 0 ? (passed / evaluable.length) * 100 : null
    return {
      cloId: c.id,
      number: c.number,
      description: c.description,
      target,
      attainment,
      status:
        attainment === null ? "NOT_EVALUATED" : attainment >= target ? "ACHIEVED" : "NOT_ACHIEVED",
      passedCount: passed,
      evaluableCount: evaluable.length,
      atRiskCount: evaluable.length - passed,
      notEvaluatedCount: rows.length - evaluable.length,
      provisionalCount: rows.filter((r) => r.provisional).length,
    }
  })
}

// ── grading (CR-09, CR-10, CR-06) ──

export type BandIn = { grade: string; minValue: number }

/** The band with the highest minValue at or below `value` (bands in any order). */
export function bandFor(bands: BandIn[], value: number): string | null {
  const sorted = [...bands].sort((x, y) => y.minValue - x.minValue)
  return sorted.find((b) => value >= b.minValue - 1e-9)?.grade ?? null
}

export type GradeComputation = {
  stats: { n: number; mean: number | null; sd: number | null }
  /** studentId → { totalPercent, grade } for every enrolled student whose scores are complete. */
  grades: Map<string, { totalPercent: number; grade: string; t: number | null }>
  /** Why the course cannot be graded now (422 on run); empty = it can. */
  refusals: string[]
  warnings: string[]
}

export function computeGrades(
  d: CourseData,
  a: ReturnType<typeof analyse>,
  bands: BandIn[],
): GradeComputation {
  const complete = a.enrolled.filter((r) => r.complete && r.totalScore !== null)
  const totals = complete.map((r) => r.totalScore!)
  const n = totals.length
  const mean = n ? totals.reduce((s, x) => s + x, 0) / n : null
  // CR-10: population SD — divide by n, never n − 1.
  const sd =
    n && mean !== null ? Math.sqrt(totals.reduce((s, x) => s + (x - mean) ** 2, 0) / n) : null

  const refusals: string[] = []
  const warnings: string[] = []
  const total = d.activities.reduce((s, x) => s + x.weight, 0)
  if (!near(total, 100))
    refusals.push(`สัดส่วนกิจกรรมรวม ${round(total)}% ต้องเป็น 100% ก่อนตัดเกรด`)
  const norm = d.course.gradeMethod === "NORM_REFERENCED"
  if (norm && n < 2) refusals.push("ตัดเกรดอิงกลุ่มต้องมีนักศึกษาที่คะแนนครบอย่างน้อย 2 คน")
  if (norm && n >= 2 && (sd ?? 0) === 0)
    refusals.push("คะแนนทุกคนเท่ากัน (SD = 0) — ใช้การตัดเกรดอิงเกณฑ์แทน")
  if (norm && n >= 2 && n < MIN_SAMPLE_SIZE)
    warnings.push(
      `อิงกลุ่มกับนักศึกษา ${n} คน (น้อยกว่า ${MIN_SAMPLE_SIZE}) ผลทางสถิติมีความหมายน้อย`,
    )
  const incomplete = a.enrolled.length - n
  if (incomplete > 0) warnings.push(`นักศึกษา ${incomplete} คนคะแนนยังไม่ครบ จะยังไม่ได้เกรด`)

  const grades = new Map<string, { totalPercent: number; grade: string; t: number | null }>()
  for (const r of complete) {
    const totalPercent = r.totalScore!
    let grade: string | null
    let t: number | null = null
    if (d.course.gradeScale === "PASS_FAIL") {
      grade = totalPercent >= d.course.passCriteria ? "S" : "U" // CR-06
    } else if (norm) {
      if (!sd) continue
      t = 50 + (10 * (totalPercent - mean!)) / sd
      grade = bandFor(bands, t)
    } else {
      grade = bandFor(bands, totalPercent)
    }
    if (grade) grades.set(r.student.id, { totalPercent, grade, t })
  }
  return { stats: { n, mean, sd }, grades, refusals, warnings }
}

export const round = (n: number) => Math.round(n * 100) / 100
