/**
 * Loads one course's rows in the shape lib/attainment.ts computes over (FR-88).
 * The only reader the dashboard, the grading page and every export use, so
 * they cannot disagree about which rows count. Shared by modules/dashboard and modules/grading, so it lives in repositories/.
 */
import { prisma } from "../db/prisma.js"
import type { CourseData } from "../lib/attainment.js"
import { groupByCourse } from "./course-data-group.js"

// One select per table, shared by load() and loadMany() so the two cannot drift apart.
const COURSE = {
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
} as const
const CLO = { id: true, number: true, description: true, classTarget: true } as const
const CLO_ORDER = { number: "asc" } as const
const OBJECTIVE = { id: true, cloId: true, number: true, weight: true } as const
const OBJECTIVE_ORDER = [{ clo: { number: "asc" } }, { number: "asc" }] as const
const ACTIVITY = {
  id: true,
  name: true,
  weight: true,
  maxScore: true,
  closedAt: true,
  passMark: true,
} as const
const ACTIVITY_ORDER = { order: "asc" } as const
const CELL = { activityId: true, objectiveId: true, weight: true } as const
const STUDENT = { id: true, studentCode: true, name: true, status: true } as const
const STUDENT_ORDER = { studentCode: "asc" } as const
const SCORE = { studentId: true, activityId: true, score: true, status: true } as const

export class CourseDataRepository {
  async load(courseId: string) {
    const [course, clos, objectives, activities, cells, students, scores, bands, grades, plans] =
      // Promise.all, not $transaction([...]): a batch transaction runs its queries one
      // after another on one connection plus BEGIN/COMMIT, ~12 round trips through
      // Supabase's pooler. These are reads, and a batch transaction is READ COMMITTED
      // anyway (no shared snapshot), so running them side by side loses nothing.
      await Promise.all([
        prisma.course.findUniqueOrThrow({ where: { id: courseId }, select: COURSE }),
        prisma.cLO.findMany({ where: { courseId }, orderBy: CLO_ORDER, select: CLO }),
        prisma.behavioralObjective.findMany({
          where: { clo: { courseId } },
          orderBy: [...OBJECTIVE_ORDER],
          select: OBJECTIVE,
        }),
        prisma.activity.findMany({
          where: { courseId },
          orderBy: ACTIVITY_ORDER,
          select: ACTIVITY,
        }),
        prisma.assessmentCriteria.findMany({ where: { activity: { courseId } }, select: CELL }),
        prisma.student.findMany({ where: { courseId }, orderBy: STUDENT_ORDER, select: STUDENT }),
        prisma.score.findMany({ where: { activity: { courseId } }, select: SCORE }),
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

  /**
   * G4 · design #72: the rows lib/attainment.ts needs for many courses, in seven
   * queries whatever the number of courses — not seven per course as load() in a
   * loop would. Grades, bands and plans are left out: the overview reads none of them.
   */
  async loadMany(courseIds: string[]): Promise<Map<string, CourseData>> {
    if (courseIds.length === 0) return new Map()
    const courseId = { in: courseIds }
    const [courses, clos, objectives, activities, cells, students, scores] = await Promise.all([
      prisma.course.findMany({ where: { id: courseId }, select: COURSE }),
      prisma.cLO.findMany({
        where: { courseId },
        orderBy: CLO_ORDER,
        select: { ...CLO, courseId: true },
      }),
      prisma.behavioralObjective.findMany({
        where: { clo: { courseId } },
        orderBy: [...OBJECTIVE_ORDER],
        select: OBJECTIVE,
      }),
      prisma.activity.findMany({
        where: { courseId },
        orderBy: ACTIVITY_ORDER,
        select: { ...ACTIVITY, courseId: true },
      }),
      prisma.assessmentCriteria.findMany({ where: { activity: { courseId } }, select: CELL }),
      prisma.student.findMany({
        where: { courseId },
        orderBy: STUDENT_ORDER,
        select: { ...STUDENT, courseId: true },
      }),
      prisma.score.findMany({ where: { activity: { courseId } }, select: SCORE }),
    ])
    return groupByCourse(courseIds, {
      courses,
      clos,
      objectives,
      activities,
      cells,
      students,
      scores,
    })
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
