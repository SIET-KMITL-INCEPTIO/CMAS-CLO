import { analyse, cloAttainment, computeGrades } from "../../lib/attainment.js"
import { buildWorkbook, fileStamp, NAME_HEADER, STUDENT_CODE_HEADER } from "../../lib/excel.js"
import type {
  CourseDataRepository,
  CourseSnapshot,
} from "../../repositories/course-data.repository.js"
import { r2, STATUS_TH } from "./dashboard-format.js"
import type { DashboardService } from "./dashboard.service.js"

/**
 * The dashboard and grade Excel exports (design #61, #71, #76): the same analysis the
 * screens show (FR-88), written to sheets (S-7). Split from DashboardService so the
 * read models and the workbook layout can change apart.
 */
export class DashboardExportService {
  constructor(
    private readonly data: CourseDataRepository,
    private readonly dashboard: Pick<DashboardService, "student">,
  ) {}

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
      const s = await this.dashboard.student(courseId, studentId!)
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
