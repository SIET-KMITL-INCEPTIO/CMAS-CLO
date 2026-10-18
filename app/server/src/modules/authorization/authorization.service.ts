/**
 * Course-level access (SRS NFR-07 / FR-25) and capabilities (A-6).
 *
 * Single-tenant means the course is the ONLY data boundary in the system:
 * there is no institution filter behind it any more. Routes do not call this
 * file directly — they declare `config.access` and middlewares/access.middleware.ts
 * calls authorize() before the handler runs, so a route cannot forget.
 *
 * Leaf rows (CLO, Activity, Score, ...) whose scope arrives as a caller-supplied
 * parent id: resolve the course first, then authorize against it.
 *
 * Still queries prisma directly — it predates the repository rule (code-rule §3)
 * and is the one exception CLAUDE.md names.
 */
import { prisma } from "../../db/prisma.js"
import { ForbiddenError } from "../../lib/errors.js"
import { CAPABILITIES, type Capability, type Role } from "./capabilities.js"

export type Caller = {
  userId: string
  role: Role
}

export class CourseNotFoundError extends Error {
  constructor() {
    // 404, never 403. A 403 confirms the id exists, which is an enumeration
    // oracle over colleagues' courses.
    super("ไม่พบรายวิชาที่ระบุ")
    this.name = "CourseNotFoundError"
  }
}

/** ADMIN sees every course; an INSTRUCTOR sees the ones they hold a CourseInstructor row for. */
export async function canSeeCourse(courseId: string, caller: Caller): Promise<boolean> {
  const course = await prisma.course.findFirst({
    where:
      caller.role === "ADMIN"
        ? { id: courseId }
        : { id: courseId, instructors: { some: { userId: caller.userId } } },
    select: { id: true },
  })
  return course !== null
}

/**
 * Throws unless `caller` holds `cap` — on `courseId` for a course capability.
 *
 * Order matters: visibility first, then role. A course the caller cannot see
 * is CourseNotFoundError (404) whatever the capability, so the answer for
 * "no such course" and "not your course" is identical. Only a caller who can
 * already see the course learns that they lack the capability (403).
 */
export async function authorize(
  cap: Capability,
  courseId: string | null,
  caller: Caller,
  lookup: typeof canSeeCourse = canSeeCourse,
): Promise<void> {
  const rule = CAPABILITIES[cap]

  if (rule.scope === "course") {
    if (!courseId || !(await lookup(courseId, caller))) throw new CourseNotFoundError()
  }

  if (!(rule.roles as readonly Role[]).includes(caller.role)) throw new ForbiddenError()
}

/** Read access to one course. Kept under this name because docs and CLAUDE.md cite it. */
export async function assertCourseAccess(courseId: string, caller: Caller): Promise<void> {
  await authorize("course.view", courseId, caller)
}
