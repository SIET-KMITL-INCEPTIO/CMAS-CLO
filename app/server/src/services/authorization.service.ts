/**
 * Course-level access (SRS NFR-07 / FR-25).
 *
 * Single-tenant means this is now the ONLY data boundary in the system: there
 * is no institution filter behind it any more, so every course-scoped route
 * must call this before touching anything. An instructor may read and edit
 * exactly the courses they are assigned to, and nothing else.
 *
 * It also covers leaf rows (CLO, Activity, Score, ...) whose scope arrives as
 * a caller-supplied parent id: resolve the course, assert access, then act.
 */
import { prisma } from "../lib/prisma.js"

export type Caller = {
  userId: string
  role: "ADMIN" | "INSTRUCTOR"
}

export class CourseNotFoundError extends Error {
  constructor() {
    // 404, never 403. A 403 confirms the id exists, which is an enumeration
    // oracle over colleagues' courses.
    super("ไม่พบรายวิชาที่ระบุ")
    this.name = "CourseNotFoundError"
  }
}

/**
 * Throws unless `caller` may act on `courseId`.
 *
 * ADMIN: any course in the faculty — existence is the whole check.
 * INSTRUCTOR: must hold a CourseInstructor row, regardless of CourseRole
 * (ASM-03: co-instructors have equal edit rights in v1).
 */
export async function assertCourseAccess(courseId: string, caller: Caller): Promise<void> {
  const course = await prisma.course.findFirst({
    where:
      caller.role === "ADMIN"
        ? { id: courseId }
        : { id: courseId, instructors: { some: { userId: caller.userId } } },
    select: { id: true },
  })

  if (!course) throw new CourseNotFoundError()
}
