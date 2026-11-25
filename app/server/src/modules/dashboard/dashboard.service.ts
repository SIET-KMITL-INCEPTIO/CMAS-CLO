import {
  activityStats,
  analyse,
  cloAttainment,
  cloRawMax,
  distribution,
  NEAR_GAP,
  type StudentResult,
} from "../../lib/attainment.js"
import { NotFoundError } from "../../lib/errors.js"
import { r2 } from "./dashboard-format.js"
import type { Caller } from "../authorization/authorization.service.js"
import type {
  CourseDataRepository,
  CourseSnapshot,
} from "../../repositories/course-data.repository.js"

/** CR-05.1 order: course fail → below a CLO or overdue → nothing to act on. */
type Level = "COURSE_FAIL" | "CLO_BELOW" | "OVERDUE"

export class DashboardService {
  constructor(private readonly data: CourseDataRepository) {}

  /**
   * Design #72 — every course the caller can see, each through the same analysis.
   * G4: the rows come in one batch (loadMany), not one course at a time.
   */
  async overview(caller: Caller) {
    const ids = await this.data.visibleCourseIds(caller)
    const all = await this.data.loadMany(ids)
    let studentCount = 0
    let cloCompleted = 0
    let cloTotal = 0
    let scored = 0
    let expected = 0
    for (const data of all.values()) {
      const a = analyse(data)
      studentCount += a.enrolled.length
      const clos = cloAttainment(data, a)
      cloTotal += clos.length
      cloCompleted += clos.filter((c) => c.status === "ACHIEVED").length
      const counted = new Set(a.counted.map((x) => x.id))
      const enrolled = new Set(a.enrolled.map((r) => r.student.id))
      expected += counted.size * enrolled.size
      scored += data.scores.filter(
        (s) => counted.has(s.activityId) && enrolled.has(s.studentId),
      ).length
    }
    return {
      courseCount: ids.length,
      studentCount,
      cloCompleted,
      cloTotal,
      scoreProgress: { scored, expected },
    }
  }

  /** Design #73 · CR-04. */
  async attainment(courseId: string) {
    const snap = await this.data.load(courseId)
    return this.attainmentOf(snap, analyse(snap.data))
  }

  private attainmentOf(snap: CourseSnapshot, a: ReturnType<typeof analyse>) {
    const clos = cloAttainment(snap.data, a)
    const rawMax = cloRawMax(snap.data)
    return {
      data: {
        classTarget: snap.course.classTarget,
        cloPassMark: snap.course.cloPassMark,
        // CR-05.1: the number the screen leads with — people who still need help.
        helpCount: a.enrolled.filter((r) =>
          [...r.clos.values()].some((c) => c.status === "AT_RISK"),
        ).length,
        // rawMax: the raw table's "เต็ม" per CLO (CR-03.2).
        clos: clos.map((c) => ({
          ...c,
          attainment: r2(c.attainment),
          rawMax: r2(rawMax.get(c.cloId)!),
        })),
      },
      meta: {
        computable: a.blockers.length === 0,
        blockers: a.blockers,
        // A CLO more than half the class fails says something about the teaching, not the students.
        teachingSignals: clos
          .filter((c) => c.evaluableCount > 0 && c.atRiskCount > c.evaluableCount / 2)
          .map((c) => c.cloId),
      },
    }
  }

  private atRiskRow(snap: CourseSnapshot, r: StudentResult) {
    const planned = new Set(
      snap.plans.filter((p) => p.studentId === r.student.id).map((p) => p.cloId),
    )
    const failedClos = snap.data.clos
      .map((c) => ({ c, v: r.clos.get(c.id)! }))
      .filter(({ v }) => v.status === "AT_RISK")
      .map(({ c, v }) => {
        const gap = snap.course.cloPassMark - v.score!
        return {
          cloId: c.id,
          number: c.number,
          score: r2(v.score),
          gap: r2(gap),
          near: gap <= NEAR_GAP,
          provisional: v.provisional,
          hasPlan: planned.has(c.id),
        }
      })
    const courseFail = r.coursePassed === false
    const level: Level | null = courseFail
      ? "COURSE_FAIL"
      : failedClos.length
        ? "CLO_BELOW"
        : r.overdue.length
          ? "OVERDUE"
          : null
    return {
      level,
      row: {
        studentId: r.student.id,
        studentCode: r.student.studentCode,
        name: r.student.name,
        level,
        failedClos,
        overdue: r.overdue.map((id) => ({
          activityId: id,
          name: snap.data.activities.find((x) => x.id === id)!.name,
        })),
        totalScore: r2(r.totalScore),
        coursePassed: r.coursePassed,
      },
      // The biggest distance from any pass mark sorts first within a level.
      worstGap: Math.max(
        courseFail ? snap.course.passCriteria - (r.totalScore ?? 0) : 0,
        ...failedClos.map((c) => c.gap ?? 0),
      ),
    }
  }

  /** Design #74 · CR-03.1: no scores yet is a third state, counted, never "at risk". */
  async atRisk(courseId: string) {
    const snap = await this.data.load(courseId)
    return this.atRiskOf(snap, analyse(snap.data))
  }

  private atRiskOf(snap: CourseSnapshot, a: ReturnType<typeof analyse>) {
    const order: Record<Level, number> = { COURSE_FAIL: 0, CLO_BELOW: 1, OVERDUE: 1 }
    const rows = a.enrolled
      .map((r) => this.atRiskRow(snap, r))
      .filter((x) => x.level !== null)
      .sort((x, y) => order[x.level!] - order[y.level!] || y.worstGap - x.worstGap)
      .map((x) => x.row)
    const notEvaluated = a.enrolled.filter((r) =>
      [...r.clos.values()].every((c) => c.status === "NOT_EVALUATED"),
    ).length
    return {
      data: rows,
      meta: {
        atRiskCount: rows.length,
        notEvaluatedCount: notEvaluated,
        evaluatedCount: a.enrolled.length - notEvaluated,
      },
    }
  }

  /**
   * The overview page in one response, from one snapshot: CLO attainment, the
   * follow-up list, how the class did overall and per activity. Three separate
   * calls each loaded the whole course again.
   */
  async summary(courseId: string) {
    const snap = await this.data.load(courseId)
    const a = analyse(snap.data)
    const complete = a.enrolled.filter((r) => r.complete && r.totalScore !== null)
    // G2 — computed in lib/attainment.ts with everything else (FR-88).
    const activities = activityStats(snap.data, a, snap.passMarks).map((x) => ({
      ...x,
      averagePercent: r2(x.averagePercent),
    }))
    return {
      attainment: this.attainmentOf(snap, a),
      atRisk: this.atRiskOf(snap, a),
      course: {
        passCriteria: snap.course.passCriteria,
        enrolledCount: a.enrolled.length,
        completeCount: complete.length,
        passedCount: complete.filter((r) => r.coursePassed === true).length,
        // FR-84: only complete totals — a missing score is not a 0.
        totals: complete.map((r) => r2(r.totalScore)!),
        distribution: distribution(a),
      },
      activities,
    }
  }

  /** The results table: every enrolled student's CLO scores in one response (was one call per student). */
  async classResults(courseId: string) {
    const snap = await this.data.load(courseId)
    const a = analyse(snap.data)
    return a.enrolled.map((r) => ({
      studentId: r.student.id,
      studentCode: r.student.studentCode,
      name: r.student.name,
      clos: snap.data.clos.map((c) => {
        const v = r.clos.get(c.id)!
        const raw = r.raw.get(c.id)!
        return {
          cloId: c.id,
          score: r2(v.score),
          status: v.status,
          provisional: v.provisional,
          // CR-03.2 · M5 — points beside the percent; null when nothing measures the CLO yet.
          raw:
            raw.linked === 0
              ? null
              : {
                  earned: r2(raw.earned)!,
                  maxScored: r2(raw.maxScored)!,
                  maxAll: r2(raw.maxAll)!,
                  missing: raw.missing,
                },
        }
      }),
      totalScore: r2(r.totalScore),
    }))
  }

  /** Design #75 · FR-85/86: raw score beside the percent (M5); no letter for an S/U course (CR-06). */
  async student(courseId: string, studentId: string) {
    const snap = await this.data.load(courseId)
    const a = analyse(snap.data)
    const r = a.results.find((x) => x.student.id === studentId)
    if (!r) throw new NotFoundError("ไม่พบนักศึกษาในรายวิชานี้")
    const issued = snap.grades.find((g) => g.studentId === studentId)
    const scoreOf = new Map(
      snap.data.scores.filter((s) => s.studentId === studentId).map((s) => [s.activityId, s]),
    )
    const { course, data } = snap
    return {
      student: {
        id: r.student.id,
        studentCode: r.student.studentCode,
        name: r.student.name,
        status: r.student.status,
      },
      gradeScale: course.gradeScale,
      clos: data.clos.map((c) => {
        const v = r.clos.get(c.id)!
        return {
          cloId: c.id,
          number: c.number,
          description: c.description,
          score: r2(v.score),
          passMark: course.cloPassMark,
          status: v.status,
          provisional: v.provisional,
          objectives: data.objectives
            .filter((o) => o.cloId === c.id)
            .map((o) => ({
              objectiveId: o.id,
              label: `${c.number}.${o.number}`,
              weight: o.weight,
              score: r2(r.objectives.get(o.id) ?? null),
            })),
        }
      }),
      activities: data.activities.map((x) => {
        const s = scoreOf.get(x.id)
        const status = s
          ? s.status === "EXCUSED"
            ? "EXCUSED"
            : "SCORED"
          : r.overdue.includes(x.id)
            ? "OVERDUE"
            : "MISSING"
        return {
          activityId: x.id,
          name: x.name,
          weight: x.weight,
          maxScore: x.maxScore,
          score: s?.score ?? null,
          percent: s && s.score !== null ? r2((s.score / x.maxScore) * 100) : null,
          status,
        }
      }),
      totalScore: r2(r.totalScore),
      coursePassed: r.coursePassed,
      passFailResult:
        course.gradeScale === "PASS_FAIL" && r.coursePassed !== null
          ? r.coursePassed
            ? "S"
            : "U"
          : null,
      grade:
        course.gradeScale === "LETTER"
          ? r.student.status === "WITHDRAWN"
            ? "W"
            : (issued?.grade ?? null)
          : null,
      remediationPlans: snap.plans
        .filter((p) => p.studentId === studentId)
        .map((p) => ({ cloId: p.cloId, plan: p.plan, updatedAt: p.updatedAt })),
    }
  }
}
