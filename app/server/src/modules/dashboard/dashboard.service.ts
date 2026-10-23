import {
  analyse,
  cloAttainment,
  computeGrades,
  NEAR_GAP,
  round,
  type StudentResult,
} from "../../lib/attainment.js"
import { buildWorkbook, fileStamp, NAME_HEADER, STUDENT_CODE_HEADER } from "../../lib/excel.js"
import { NotFoundError } from "../../lib/errors.js"
import type { Caller } from "../authorization/authorization.service.js"
import type { CourseDataRepository, CourseSnapshot } from "./course-data.repository.js"

const r2 = (n: number | null) => (n === null ? null : round(n))
const STATUS_TH = {
  PASS: "ผ่าน",
  AT_RISK: "ยังไม่ผ่าน",
  NOT_EVALUATED: "ยังประเมินไม่ครบ",
} as const

/** CR-05.1 order: course fail → below a CLO or overdue → nothing to act on. */
type Level = "COURSE_FAIL" | "CLO_BELOW" | "OVERDUE"

export class DashboardService {
  constructor(private readonly data: CourseDataRepository) {}

  /** Design #72 — every course the caller can see, each through the same analysis. */
  async overview(caller: Caller) {
    const ids = await this.data.visibleCourseIds(caller)
    let studentCount = 0
    let cloCompleted = 0
    let cloTotal = 0
    let scored = 0
    let expected = 0
    for (const id of ids) {
      const snap = await this.data.load(id)
      const a = analyse(snap.data)
      studentCount += a.enrolled.length
      const clos = cloAttainment(snap.data, a)
      cloTotal += clos.length
      cloCompleted += clos.filter((c) => c.status === "ACHIEVED").length
      const counted = new Set(a.counted.map((x) => x.id))
      const enrolled = new Set(a.enrolled.map((r) => r.student.id))
      expected += counted.size * enrolled.size
      scored += snap.data.scores.filter(
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
    const a = analyse(snap.data)
    const clos = cloAttainment(snap.data, a)
    return {
      data: {
        classTarget: snap.course.classTarget,
        cloPassMark: snap.course.cloPassMark,
        // CR-05.1: the number the screen leads with — people who still need help.
        helpCount: a.enrolled.filter((r) =>
          [...r.clos.values()].some((c) => c.status === "AT_RISK"),
        ).length,
        clos: clos.map((c) => ({ ...c, attainment: r2(c.attainment) })),
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
    const a = analyse(snap.data)
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

  // ── exports (design #61, #71, #76) — the same analysis, written to Excel (S-7) ──

  private header(snap: CourseSnapshot): [string, string][] {
    const c = snap.course
    return [
      ["รายวิชา", `${c.code} ${c.name}`],
      ["Sec", c.section],
      ["ภาค/ปีการศึกษา", `${c.semester}/${c.year}`],
      ["เกณฑ์ผ่าน CLO", `${c.cloPassMark}%`],
    ]
  }

  private rawSheet(snap: CourseSnapshot, a: ReturnType<typeof analyse>) {
    const { activities } = snap.data
    const cell = new Map(snap.data.scores.map((s) => [`${s.studentId}|${s.activityId}`, s]))
    return {
      name: "คะแนนดิบ",
      title: "คะแนนดิบรายกิจกรรม",
      info: this.header(snap),
      head: [
        STUDENT_CODE_HEADER,
        NAME_HEADER,
        "สถานะ",
        ...activities.map((x) => `${x.name} (เต็ม ${x.maxScore})`),
        "คะแนนรวม (%)",
      ],
      rows: a.results.map((r) => [
        r.student.studentCode,
        r.student.name,
        r.student.status === "WITHDRAWN" ? "ถอน" : "",
        ...activities.map((x) => {
          const s = cell.get(`${r.student.id}|${x.id}`)
          return s ? (s.status === "EXCUSED" ? "ยกเว้น" : s.score) : null
        }),
        r2(r.totalScore),
      ]),
    }
  }

  private cloSheet(snap: CourseSnapshot, a: ReturnType<typeof analyse>) {
    const { clos } = snap.data
    return {
      name: "คะแนนราย CLO",
      title: "คะแนนราย CLO (%)",
      info: this.header(snap),
      head: [
        STUDENT_CODE_HEADER,
        NAME_HEADER,
        ...clos.flatMap((c) => [`CLO ${c.number}`, `CLO ${c.number} สถานะ`]),
      ],
      rows: a.enrolled.map((r) => [
        r.student.studentCode,
        r.student.name,
        ...clos.flatMap((c) => {
          const v = r.clos.get(c.id)!
          return [r2(v.score), STATUS_TH[v.status]]
        }),
      ]),
    }
  }

  private summarySheet(snap: CourseSnapshot, a: ReturnType<typeof analyse>) {
    return {
      name: "สรุปราย CLO",
      title: "สรุปผลการบรรลุ CLO",
      info: this.header(snap),
      head: [
        "CLO",
        "คำอธิบาย",
        "ผ่าน (คน)",
        "ประเมินได้ (คน)",
        "ยังประเมินไม่ครบ (คน)",
        "บรรลุ (%)",
        "เป้า (%)",
      ],
      rows: cloAttainment(snap.data, a).map((c) => [
        `CLO ${c.number}`,
        c.description,
        c.passedCount,
        c.evaluableCount,
        c.notEvaluatedCount,
        r2(c.attainment),
        c.target,
      ]),
    }
  }

  private needHelpSheet(snap: CourseSnapshot, a: ReturnType<typeof analyse>) {
    const plan = new Map(snap.plans.map((p) => [`${p.studentId}|${p.cloId}`, p.plan]))
    const rows = a.enrolled.flatMap((r) =>
      snap.data.clos
        .filter((c) => r.clos.get(c.id)!.status === "AT_RISK")
        .map((c) => [
          `CLO ${c.number}`,
          r.student.studentCode,
          r.student.name,
          r2(r.clos.get(c.id)!.score),
          plan.get(`${r.student.id}|${c.id}`) ?? "",
        ]),
    )
    return {
      name: "ยังไม่ผ่านราย CLO",
      title: "นักศึกษาที่ยังไม่ผ่านราย CLO และแผนพัฒนาผู้เรียน",
      info: this.header(snap),
      head: ["CLO", STUDENT_CODE_HEADER, NAME_HEADER, "คะแนน CLO (%)", "แผนพัฒนาผู้เรียน"],
      rows,
    }
  }

  private gradeSheet(snap: CourseSnapshot, a: ReturnType<typeof analyse>) {
    const live = computeGrades(snap.data, a, snap.bands).grades
    const issued = new Map(snap.grades.map((g) => [g.studentId, g]))
    const pf = snap.course.gradeScale === "PASS_FAIL"
    return {
      name: "เกรด",
      title: issued.size ? "เกรด (ตรึงแล้ว)" : "เกรด (ยังไม่ตรึง — ตามคะแนนปัจจุบัน)",
      info: this.header(snap),
      head: [
        STUDENT_CODE_HEADER,
        NAME_HEADER,
        "คะแนนรวม (%)",
        pf ? "ผล (S/U)" : "เกรด",
        "เหตุผลการปรับเกรด",
      ],
      rows: a.results.map((r) => {
        const g = issued.get(r.student.id)
        const grade =
          r.student.status === "WITHDRAWN"
            ? "W"
            : (g?.grade ?? live.get(r.student.id)?.grade ?? "ยังประเมินไม่ครบ")
        return [
          r.student.studentCode,
          r.student.name,
          r2(r.totalScore),
          grade,
          g?.overrideReason ?? "",
        ]
      }),
    }
  }

  /** Design #61. */
  async scoresExport(courseId: string, type: "raw" | "clo" | "both") {
    const snap = await this.data.load(courseId)
    const a = analyse(snap.data)
    const sheets = [
      ...(type !== "clo" ? [this.rawSheet(snap, a)] : []),
      ...(type !== "raw" ? [this.cloSheet(snap, a)] : []),
    ]
    return {
      buffer: buildWorkbook(sheets),
      fileName: `scores-${snap.course.code}-${snap.course.section}-${fileStamp()}.xlsx`,
    }
  }

  /** Design #71. */
  async gradesExport(courseId: string) {
    const snap = await this.data.load(courseId)
    const a = analyse(snap.data)
    return {
      buffer: buildWorkbook([
        this.summarySheet(snap, a),
        this.needHelpSheet(snap, a),
        this.gradeSheet(snap, a),
      ]),
      fileName: `grades-${snap.course.code}-${snap.course.section}-${fileStamp()}.xlsx`,
    }
  }

  /** Design #76. */
  async dashboardExport(courseId: string, scope: "course" | "student", studentId?: string) {
    if (scope === "student") {
      const s = await this.student(courseId, studentId!)
      const snap = await this.data.load(courseId)
      return {
        buffer: buildWorkbook([
          {
            name: "รายบุคคล",
            title: `รายงานรายบุคคล ${s.student.studentCode} ${s.student.name}`,
            info: [
              ...this.header(snap),
              ["คะแนนรวม (%)", String(s.totalScore ?? "—")],
              [
                "ผลรายวิชา",
                s.coursePassed === null ? "ยังประเมินไม่ครบ" : s.coursePassed ? "ผ่าน" : "ไม่ผ่าน",
              ],
            ],
            head: ["CLO", "คะแนน (%)", "เกณฑ์ (%)", "สถานะ", "แผนพัฒนาผู้เรียน"],
            rows: s.clos.map((c) => [
              `CLO ${c.number}`,
              c.score,
              c.passMark,
              STATUS_TH[c.status],
              s.remediationPlans.find((p) => p.cloId === c.cloId)?.plan ?? "",
            ]),
          },
        ]),
        fileName: `student-${s.student.studentCode}-${fileStamp()}.xlsx`,
      }
    }
    const snap = await this.data.load(courseId)
    const a = analyse(snap.data)
    return {
      buffer: buildWorkbook([
        this.summarySheet(snap, a),
        this.cloSheet(snap, a),
        this.needHelpSheet(snap, a),
      ]),
      fileName: `dashboard-${snap.course.code}-${snap.course.section}-${fileStamp()}.xlsx`,
    }
  }
}
