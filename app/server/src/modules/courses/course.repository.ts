/**
 * The only file in modules/courses that touches Prisma: Course, CourseInstructor,
 * and the GradeBand rows a course is created with.
 */
import { Prisma } from "@prisma/client"
import { prisma } from "../../db/prisma.js"
import { ConflictError } from "../../lib/errors.js"
import type { Band } from "../../lib/grade-ladder.js"

// A-9: an explicit select, so a column added later does not leak by default.
export const COURSE_SELECT = {
  id: true,
  code: true,
  name: true,
  nameEn: true,
  semester: true,
  year: true,
  section: true,
  credits: true,
  lectureHours: true,
  practiceHours: true,
  selfStudyHours: true,
  gradeScale: true,
  gradeMethod: true,
  weightMode: true,
  passCriteria: true,
  cloPassMark: true,
  classTarget: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { clos: true, activities: true, students: true } },
  instructors: {
    select: { userId: true, user: { select: { name: true } } },
    orderBy: { assignedAt: "asc" },
  },
} satisfies Prisma.CourseSelect

export type CourseRow = Prisma.CourseGetPayload<{ select: typeof COURSE_SELECT }>

export type CourseData = Omit<
  Prisma.CourseUncheckedCreateInput,
  "id" | "createdAt" | "updatedAt" | "instructors" | "clos" | "activities" | "students"
>

const DUPLICATE_COURSE = "รหัสวิชานี้มีอยู่แล้วในภาคเรียนนี้"

/** P2002 on Course is always the (code, semester, year, section) key (FR-21). */
async function uniqueCourse<T>(write: Promise<T>): Promise<T> {
  try {
    return await write
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError(DUPLICATE_COURSE)
    }
    throw err
  }
}

export class CourseRepository {
  /** NFR-06: visibility is part of the query, never a filter applied afterwards. */
  visibleTo(caller: { userId: string; role: string }): Prisma.CourseWhereInput {
    return caller.role === "ADMIN" ? {} : { instructors: { some: { userId: caller.userId } } }
  }

  async list(
    where: Prisma.CourseWhereInput,
    orderBy: Prisma.CourseOrderByWithRelationInput,
    skip: number,
    take: number,
  ) {
    const [total, rows] = await prisma.$transaction([
      prisma.course.count({ where }),
      // _count is a correlated subquery in the same statement: no N+1 (NFR-02).
      prisma.course.findMany({
        where,
        orderBy: [orderBy, { section: "asc" }],
        skip,
        take,
        select: COURSE_SELECT,
      }),
    ])
    return { total, rows }
  }

  findById(id: string): Promise<CourseRow | null> {
    return prisma.course.findUnique({ where: { id }, select: COURSE_SELECT })
  }

  findBands(courseId: string) {
    return prisma.gradeBand.findMany({
      where: { courseId },
      select: { grade: true, minValue: true },
      orderBy: { minValue: "desc" },
    })
  }

  /** Accounts that could be put on a course. The service decides which are acceptable. */
  findUsers(ids: string[]) {
    return prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, role: true, isActive: true, status: true },
    })
  }

  /** Course, instructors and grade ladder in one transaction (NFR-11). */
  create(data: CourseData, instructorIds: string[], bands: Band[]): Promise<CourseRow> {
    return uniqueCourse(
      prisma.course.create({
        data: {
          ...data,
          instructors: { create: instructorIds.map((userId) => ({ userId })) },
          gradeBands: { create: bands },
        },
        select: COURSE_SELECT,
      }),
    )
  }

  /** `bands` replaces the ladder when the grade scale or method changed; null keeps it. */
  update(id: string, data: Partial<CourseData>, bands: Band[] | null): Promise<CourseRow> {
    return uniqueCourse(
      prisma.$transaction(async (tx) => {
        // Course before bands: the 0004 trigger checks a new band against the stored scale.
        if (bands) await tx.gradeBand.deleteMany({ where: { courseId: id } })
        const course = await tx.course.update({ where: { id }, data, select: COURSE_SELECT })
        if (bands) {
          await tx.gradeBand.createMany({ data: bands.map((b) => ({ ...b, courseId: id })) })
        }
        return course
      }),
    )
  }

  /** CR-06: on an S/U course the S band IS the pass mark. */
  setPassBand(courseId: string, minValue: number) {
    return prisma.gradeBand.updateMany({ where: { courseId, grade: "S" }, data: { minValue } })
  }

  countFrozenGrades(courseId: string) {
    return prisma.studentGrade.count({ where: { student: { courseId } } })
  }

  /** Every row DELETE /courses/:courseId takes with it (FR-26). */
  async impact(courseId: string) {
    const [clos, objectives, activities, criteria, students, scores, uploadLogs, remediationPlans] =
      await prisma.$transaction([
        prisma.cLO.count({ where: { courseId } }),
        prisma.behavioralObjective.count({ where: { clo: { courseId } } }),
        prisma.activity.count({ where: { courseId } }),
        prisma.assessmentCriteria.count({ where: { activity: { courseId } } }),
        prisma.student.count({ where: { courseId } }),
        prisma.score.count({ where: { activity: { courseId } } }),
        prisma.scoreUploadLog.count({ where: { courseId } }),
        prisma.remediationPlan.count({ where: { student: { courseId } } }),
      ])
    return {
      clos,
      objectives,
      activities,
      criteria,
      students,
      scores,
      uploadLogs,
      remediationPlans,
    }
  }

  async delete(id: string): Promise<void> {
    await prisma.course.delete({ where: { id } })
  }

  listInstructors(courseId: string) {
    return prisma.courseInstructor.findMany({
      where: { courseId },
      orderBy: { assignedAt: "asc" },
      select: { userId: true, assignedAt: true, user: { select: { name: true, email: true } } },
    })
  }

  async addInstructor(courseId: string, userId: string): Promise<void> {
    try {
      await prisma.courseInstructor.create({ data: { courseId, userId } })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError("ผู้สอนคนนี้อยู่ในรายวิชาแล้ว")
      }
      throw err
    }
  }

  /**
   * S-9: lock the course row before counting, so two removals racing each
   * other cannot both see "2 instructors" and leave the course with none.
   * Returns what the service needs to decide; the delete happens only on "ok".
   */
  removeInstructor(courseId: string, userId: string): Promise<"ok" | "missing" | "last"> {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Course" WHERE id = ${courseId} FOR UPDATE`
      const rows = await tx.courseInstructor.findMany({
        where: { courseId },
        select: { userId: true },
      })
      if (!rows.some((r) => r.userId === userId)) return "missing"
      if (rows.length <= 1) return "last"
      await tx.courseInstructor.delete({ where: { courseId_userId: { courseId, userId } } })
      return "ok"
    })
  }

  sectionsInUse(code: string, semester: number, year: number) {
    return prisma.course.findMany({ where: { code, semester, year }, select: { section: true } })
  }

  /** Everything POST /courses/:courseId/duplicate copies — never students, scores or plans. */
  findTree(id: string) {
    return prisma.course.findUnique({
      where: { id },
      include: {
        instructors: { select: { userId: true } },
        gradeBands: { select: { grade: true, minValue: true } },
        groupWeights: { select: { type: true, weight: true } },
        clos: { include: { objectives: true }, orderBy: { number: "asc" } },
        activities: { include: { criteria: true }, orderBy: { order: "asc" } },
      },
    })
  }

  /**
   * One transaction (design #24). Ids are mapped old → new as rows are made, so
   * the criteria can point at the copied activity and objective.
   */
  duplicate(
    tree: NonNullable<Awaited<ReturnType<CourseRepository["findTree"]>>>,
    section: string,
    instructorIds: string[],
  ): Promise<CourseRow> {
    return uniqueCourse(
      prisma.$transaction(
        async (tx) => {
          const {
            id: _id,
            createdAt: _c,
            updatedAt: _u,
            instructors: _i,
            gradeBands,
            groupWeights,
            clos,
            activities,
            ...settings
          } = tree
          const course = await tx.course.create({
            data: {
              ...settings,
              section,
              instructors: { create: instructorIds.map((userId) => ({ userId })) },
              gradeBands: { create: gradeBands },
              groupWeights: { create: groupWeights },
            },
            select: { id: true },
          })

          const objectiveMap = new Map<string, string>()
          for (const clo of clos) {
            const { id: oldCloId, courseId: _cid, objectives, ...cloData } = clo
            void oldCloId
            const created = await tx.cLO.create({
              data: {
                ...cloData,
                courseId: course.id,
                objectives: {
                  create: objectives.map(({ id: _oid, cloId: _cl, ...o }) => o),
                },
              },
              select: { objectives: { select: { id: true, number: true } } },
            })
            for (const o of objectives) {
              const copy = created.objectives.find((c) => c.number === o.number)
              if (copy) objectiveMap.set(o.id, copy.id)
            }
          }

          for (const activity of activities) {
            const { id: _aid, courseId: _cid, criteria, ...activityData } = activity
            await tx.activity.create({
              data: {
                ...activityData,
                closedAt: null,
                courseId: course.id,
                criteria: {
                  create: criteria.map((c) => ({
                    objectiveId: objectiveMap.get(c.objectiveId)!,
                    weight: c.weight,
                  })),
                },
              },
            })
          }

          return tx.course.findUniqueOrThrow({ where: { id: course.id }, select: COURSE_SELECT })
        },
        { timeout: 30_000 },
      ),
    )
  }
}
