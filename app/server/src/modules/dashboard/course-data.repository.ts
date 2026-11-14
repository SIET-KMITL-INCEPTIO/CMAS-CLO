/**
 * Loads one course's rows in the shape lib/attainment.ts computes over (FR-88).
 * The only reader the dashboard, the grading page and every export use, so
 * they cannot disagree about which rows count. Shared by modules/grading.
 */
import { prisma } from "../../db/prisma.js"
import type { CourseData } from "../../lib/attainment.js"

export class CourseDataRepository {
  async load(courseId: string) {
    const [course, clos, objectives, activities, cells, students, scores, bands, grades, plans] =
      // Promise.all, not $transaction([...]): a batch transaction runs its queries one
      // after another on one connection plus BEGIN/COMMIT, ~12 round trips through
      // Supabase's pooler. These are reads, and a batch transaction is READ COMMITTED
      // anyway (no shared snapshot), so running them side by side loses nothing.
      await Promise.all([
        prisma.course.findUniqueOrThrow({
          where: { id: courseId },
          select: {
            id: true,
            code: true,
            name: true,
            section: true,
            semester: true,
            year: true,
            cloPassMark: true,
            classTarget: true,
            passCriteria: true,
            gradeScale: true,
            gradeMethod: true,
          },
        }),
        prisma.cLO.findMany({
          where: { courseId },
          orderBy: { number: "asc" },
          select: { id: true, number: true, description: true, classTarget: true },
        }),
        prisma.behavioralObjective.findMany({
          where: { clo: { courseId } },
          orderBy: [{ clo: { number: "asc" } }, { number: "asc" }],
          select: { id: true, cloId: true, number: true, weight: true },
        }),
        prisma.activity.findMany({
          where: { courseId },
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            weight: true,
            maxScore: true,
            closedAt: true,
            passMark: true,
          },
        }),
        prisma.assessmentCriteria.findMany({
          where: { activity: { courseId } },
          select: { activityId: true, objectiveId: true, weight: true },
        }),
        prisma.student.findMany({
          where: { courseId },
          orderBy: { studentCode: "asc" },
          select: { id: true, studentCode: true, name: true, status: true },
        }),
        prisma.score.findMany({
          where: { activity: { courseId } },
          select: { studentId: true, activityId: true, score: true, status: true },
        }),
        prisma.gradeBand.findMany({
          where: { courseId },
          orderBy: { minValue: "desc" },
          select: { grade: true, minValue: true },
        }),
        prisma.studentGrade.findMany({
          where: { student: { courseId } },
          select: { studentId: true, totalPercent: true, grade: true, overrideReason: true },
        }),
        prisma.remediationPlan.findMany({
          where: { student: { courseId } },
          select: { studentId: true, cloId: true, plan: true, updatedAt: true },
        }),
      ])
    const data: CourseData = { course, clos, objectives, activities, cells, students, scores }
    // passMark rides outside `data`: it is reported, never part of a formula.
    const passMarks = new Map(activities.map((x) => [x.id, x.passMark]))
    return { course, data, bands, grades, plans, passMarks }
  }

  /** Courses the dashboard overview covers (NFR-06: visibility in the query). */
  visibleCourseIds(caller: { userId: string; role: string }) {
    return prisma.course
      .findMany({
        where: caller.role === "ADMIN" ? {} : { instructors: { some: { userId: caller.userId } } },
        select: { id: true },
      })
      .then((rows) => rows.map((r) => r.id))
  }
}

export type CourseSnapshot = Awaited<ReturnType<CourseDataRepository["load"]>>
