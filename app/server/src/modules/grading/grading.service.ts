import { analyse, bandFor, computeGrades, round } from "../../lib/attainment.js"
import { BusinessRuleError, NotFoundError } from "../../lib/errors.js"
import { FAILING_GRADES, lowestPassingMin, takesPassCriteria } from "../../lib/grade-ladder.js"
import type { CourseDataRepository, CourseSnapshot } from "../dashboard/course-data.repository.js"
import type { GradingRepository } from "./grading.repository.js"
import type { GradeBandsInput } from "./grading.validator.js"

export class GradingService {
  constructor(
    private readonly data: CourseDataRepository,
    private readonly grading: GradingRepository,
  ) {}

  /** The live computation over the stored ladder — what "derived grade" means everywhere. */
  private compute(snap: CourseSnapshot) {
    const a = analyse(snap.data)
    return { a, g: computeGrades(snap.data, a, snap.bands) }
  }

  /** Design #65. */
  async get(courseId: string) {
    const snap = await this.data.load(courseId)
    const { course, bands, grades } = snap
    const { a, g } = this.compute(snap)
    const issued = new Map(grades.map((x) => [x.studentId, x]))
    const frozen = grades.length > 0
    const percent = course.gradeMethod === "CRITERION_REFERENCED"
    const passFloor = course.gradeScale === "LETTER" && percent ? lowestPassingMin(bands) : null
    const shown = (studentId: string) =>
      issued.get(studentId)?.grade ?? g.grades.get(studentId)?.grade

    const sorted = [...bands].sort((x, y) => y.minValue - x.minValue)
    return {
      gradeScale: course.gradeScale,
      gradeMethod: course.gradeMethod,
      passCriteria: course.passCriteria,
      passCriteriaSource: takesPassCriteria(course.gradeScale, course.gradeMethod)
        ? "MANUAL"
        : "LADDER",
      bands: sorted.map((b, i) => ({
        grade: b.grade,
        minValue: b.minValue,
        // H4: the upper edge is shown as the next band's floor; the top band ends at 100 (percent only).
        maxValue: i === 0 ? (percent ? 100 : null) : sorted[i - 1]!.minValue,
        count: a.enrolled.filter((r) => shown(r.student.id) === b.grade).length,
        isPassFloor: passFloor !== null && b.minValue === passFloor && !FAILING_GRADES.has(b.grade),
        isFail: FAILING_GRADES.has(b.grade),
      })),
      frozen,
      students: a.results.map((r) => {
        const live = g.grades.get(r.student.id)
        const row = issued.get(r.student.id)
        return {
          studentId: r.student.id,
          studentCode: r.student.studentCode,
          name: r.student.name,
          status: r.student.status,
          totalPercent: r.totalScore === null ? null : round(r.totalScore),
          complete: r.complete,
          tScore: live?.t === null || live?.t === undefined ? null : round(live.t),
          // A withdrawn student shows W and is in no statistic (CR-05.1).
          derivedGrade: r.student.status === "WITHDRAWN" ? "W" : (live?.grade ?? null),
          issuedGrade: row?.grade ?? null,
          overrideReason: row?.overrideReason ?? null,
        }
      }),
      stats: {
        n: g.stats.n,
        mean: g.stats.mean === null ? null : round(g.stats.mean),
        sd: g.stats.sd === null ? null : round(g.stats.sd),
      },
      meta: { warnings: [...g.refusals, ...g.warnings] },
    }
  }

  /** Design #66: the ladder replaced as a whole, with the settings it implies. */
  async saveBands(courseId: string, input: GradeBandsInput) {
    const { course } = await this.data.load(courseId)
    const gradeScale = input.gradeScale ?? course.gradeScale
    const gradeMethod = input.gradeMethod ?? course.gradeMethod
    const bands = input.bands

    if (gradeScale === "PASS_FAIL" && gradeMethod === "NORM_REFERENCED") {
      throw new BusinessRuleError("รายวิชาแบบผ่าน/ไม่ผ่าน ตัดเกรดอิงกลุ่มไม่ได้")
    }
    if (input.passCriteria !== undefined && !takesPassCriteria(gradeScale, gradeMethod)) {
      throw new BusinessRuleError(
        "รายวิชา A–F อิงเกณฑ์ใช้ขอบล่างของเกรดต่ำสุดที่ผ่านเป็นเกณฑ์ — ไม่ต้องส่ง passCriteria",
      )
    }
    if (
      (gradeScale !== course.gradeScale || gradeMethod !== course.gradeMethod) &&
      (await this.grading.countFrozen(courseId)) > 0
    ) {
      throw new BusinessRuleError("มีเกรดที่ตรึงไว้แล้ว — ยกเลิกการตรึงก่อนเปลี่ยนรูปแบบเกรด")
    }
    if (new Set(bands.map((b) => b.grade)).size !== bands.length)
      throw new BusinessRuleError("ชื่อเกรดซ้ำกัน")
    if (new Set(bands.map((b) => b.minValue)).size !== bands.length)
      throw new BusinessRuleError("คะแนนเริ่มของเกรดซ้ำกัน")
    if (!bands.some((b) => b.minValue === 0))
      throw new BusinessRuleError("ต้องมีเกรดที่เริ่มที่ 0 (CR-09)")
    if (gradeMethod === "CRITERION_REFERENCED" && bands.some((b) => b.minValue > 100)) {
      throw new BusinessRuleError("ขั้นอิงเกณฑ์เป็นร้อยละ — คะแนนเริ่มต้องไม่เกิน 100")
    }

    let passCriteria: number
    if (gradeScale === "PASS_FAIL") {
      const grades = bands.map((b) => b.grade).sort()
      if (grades.join() !== "S,U")
        throw new BusinessRuleError("รายวิชาผ่าน/ไม่ผ่านต้องมีขั้น S และ U เท่านั้น")
      // CR-06: the S band IS the pass mark, so the two can never drift.
      passCriteria = input.passCriteria ?? bands.find((b) => b.grade === "S")!.minValue
      bands.find((b) => b.grade === "S")!.minValue = passCriteria
      bands.find((b) => b.grade === "U")!.minValue = 0
      if (passCriteria === 0) throw new BusinessRuleError("เกณฑ์ผ่าน (S) ต้องมากกว่า 0")
    } else if (gradeMethod === "CRITERION_REFERENCED") {
      passCriteria = lowestPassingMin(bands) // 2569-10-19: derived from the ladder
    } else {
      passCriteria = input.passCriteria ?? course.passCriteria
    }

    await this.grading.saveLadder(courseId, { gradeScale, gradeMethod, passCriteria }, bands)
    return this.get(courseId)
  }

  /** Design #67 · CR-11: compute once, store the letters. */
  async run(courseId: string) {
    const snap = await this.data.load(courseId)
    const { a, g } = this.compute(snap)
    if (g.refusals.length) throw new BusinessRuleError(g.refusals.join(" · "))
    const grades = [...g.grades].map(([studentId, x]) => ({
      studentId,
      totalPercent: x.totalPercent,
      grade: x.grade,
    }))
    await this.grading.freeze(courseId, grades)
    return {
      frozenAt: new Date(),
      issued: grades.length,
      skipped: a.enrolled.length - grades.length,
    }
  }

  /** Design #68. Overrides go too, which is why it needs confirm. */
  async unfreeze(courseId: string, confirm: boolean) {
    if ((await this.grading.countFrozen(courseId)) === 0)
      throw new BusinessRuleError("ยังไม่ได้ตรึงเกรด")
    if (!confirm)
      throw new BusinessRuleError("ส่ง ?confirm=true เพื่อยืนยัน — การปรับเกรดทั้งหมดจะหายด้วย")
    return { unfrozen: await this.grading.unfreeze(courseId) }
  }

  private async derived(courseId: string, studentId: string) {
    const snap = await this.data.load(courseId)
    const { a, g } = this.compute(snap)
    const r = a.results.find((x) => x.student.id === studentId)
    return { snap, r, grade: g.grades.get(studentId)?.grade ?? null }
  }

  /** Design #69: an override needs a grade on the ladder and a reason (CHECK in 0004). */
  async override(courseId: string, studentId: string, grade: string, reason: string) {
    const row = await this.grading.findGrade(studentId)
    if (!row) throw new BusinessRuleError("ยังไม่ได้ตรึงเกรดของนักศึกษาคนนี้ — กดตัดเกรดก่อน")
    const { snap, r, grade: derivedGrade } = await this.derived(courseId, studentId)
    if (r?.student.status === "WITHDRAWN") throw new BusinessRuleError("นักศึกษาถอนรายวิชาแล้ว")
    const ladder =
      snap.course.gradeScale === "PASS_FAIL" ? ["S", "U"] : snap.bands.map((b) => b.grade)
    if (!ladder.includes(grade))
      throw new BusinessRuleError(`ไม่มีเกรด ${grade} ในขั้นบันไดของรายวิชานี้`)
    const saved = await this.grading.setGrade(studentId, grade, reason)
    return {
      studentId,
      derivedGrade,
      issuedGrade: saved.grade,
      overrideReason: saved.overrideReason,
    }
  }

  /** Design #70: back to the ladder's grade for the stored total; the course stays frozen. */
  async clearOverride(courseId: string, studentId: string) {
    const row = await this.grading.findGrade(studentId)
    if (!row?.overrideReason) throw new NotFoundError("นักศึกษาคนนี้ไม่มีการปรับเกรด")
    const { snap, grade } = await this.derived(courseId, studentId)
    // อิงเกณฑ์ is reproducible from the stored total; อิงกลุ่ม uses today's cohort (CR-11).
    const back =
      snap.course.gradeScale === "PASS_FAIL"
        ? row.totalPercent >= snap.course.passCriteria
          ? "S"
          : "U"
        : snap.course.gradeMethod === "CRITERION_REFERENCED"
          ? bandFor(snap.bands, row.totalPercent)
          : grade
    if (!back) throw new BusinessRuleError("คำนวณเกรดตามคะแนนไม่ได้ในตอนนี้ — ตัดเกรดใหม่")
    const saved = await this.grading.setGrade(studentId, back, null)
    return { studentId, derivedGrade: back, issuedGrade: saved.grade, overrideReason: null }
  }
}
