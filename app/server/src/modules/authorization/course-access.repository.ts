/**
 * The lookups behind course-level access: can this caller see a course, and which
 * course does a leaf row (CLO, activity, student, ...) belong to. Reads only.
 */
import { prisma } from "../../db/prisma.js"

export type LeafParam = "studentId" | "activityId" | "objectiveId" | "cloId" | "uploadId"

const select = { courseId: true } as const

export class CourseAccessRepository {
  /** ADMIN sees every course; anyone else needs a CourseInstructor row. */
  async isVisible(courseId: string, userId: string, admin: boolean): Promise<boolean> {
    const course = await prisma.course.findFirst({
      where: admin ? { id: courseId } : { id: courseId, instructors: { some: { userId } } },
      select: { id: true },
    })
    return course !== null
  }

  /** The course a leaf row belongs to, or null when there is no such row. */
  async courseIdOf(param: LeafParam, id: string): Promise<string | null> {
    switch (param) {
      case "cloId":
        return (await prisma.cLO.findUnique({ where: { id }, select }))?.courseId ?? null
      case "activityId":
        return (await prisma.activity.findUnique({ where: { id }, select }))?.courseId ?? null
      case "studentId":
        return (await prisma.student.findUnique({ where: { id }, select }))?.courseId ?? null
      case "uploadId":
        return (await prisma.scoreUploadLog.findUnique({ where: { id }, select }))?.courseId ?? null
      case "objectiveId": {
        const row = await prisma.behavioralObjective.findUnique({
          where: { id },
          select: { clo: { select } },
        })
        return row?.clo.courseId ?? null
      }
    }
  }
}
