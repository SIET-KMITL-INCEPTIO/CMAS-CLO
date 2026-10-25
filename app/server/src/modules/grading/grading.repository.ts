/** GradeBand, StudentGrade and the grading columns of Course (design #65-#70). */
import { prisma } from "../../db/prisma.js"
import type { Band } from "../../lib/grade-ladder.js"

export class GradingRepository {
  countFrozen(courseId: string) {
    return prisma.studentGrade.count({ where: { student: { courseId } } })
  }

  /** The ladder and the settings it implies, replaced together (design #66). */
  async saveLadder(
    courseId: string,
    settings: {
      gradeScale: "LETTER" | "PASS_FAIL"
      gradeMethod: "CRITERION_REFERENCED" | "NORM_REFERENCED"
      passCriteria: number
    },
    bands: Band[],
  ) {
    // Course first: the 0004 trigger checks new bands against the course's scale as stored.
    await prisma.$transaction([
      prisma.gradeBand.deleteMany({ where: { courseId } }),
      prisma.course.update({ where: { id: courseId }, data: settings }),
      prisma.gradeBand.createMany({ data: bands.map((b) => ({ ...b, courseId })) }),
    ])
  }

  /**
   * CR-11: freeze. Rows an instructor overrode keep their grade and reason;
   * every other issued row is written fresh, and a student who is no longer
   * gradable loses a stale grade.
   */
  freeze(courseId: string, grades: { studentId: string; totalPercent: number; grade: string }[]) {
    return prisma.$transaction(
      async (tx) => {
        const overridden = await tx.studentGrade.findMany({
          where: { student: { courseId }, overrideReason: { not: null } },
          select: { studentId: true },
        })
        const keep = new Set(overridden.map((g) => g.studentId))
        await tx.studentGrade.deleteMany({ where: { student: { courseId }, overrideReason: null } })
        const fresh = grades.filter((g) => !keep.has(g.studentId))
        await tx.studentGrade.createMany({ data: fresh })
        for (const g of grades.filter((x) => keep.has(x.studentId))) {
          await tx.studentGrade.update({
            where: { studentId: g.studentId },
            data: { totalPercent: g.totalPercent },
          })
        }
        return { issued: grades.length, kept: keep.size }
      },
      { timeout: 30_000 },
    )
  }

  async unfreeze(courseId: string) {
    const { count } = await prisma.studentGrade.deleteMany({ where: { student: { courseId } } })
    return count
  }

  findGrade(studentId: string) {
    return prisma.studentGrade.findUnique({ where: { studentId } })
  }

  setGrade(studentId: string, grade: string, overrideReason: string | null) {
    return prisma.studentGrade.update({ where: { studentId }, data: { grade, overrideReason } })
  }
}
