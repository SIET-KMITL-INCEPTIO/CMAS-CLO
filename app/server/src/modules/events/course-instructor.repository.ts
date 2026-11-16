/** Who teaches a course — the people a "course changed" event may reach. */
import { prisma } from "../../db/prisma.js"

export class CourseInstructorRepository {
  async userIdsOf(courseId: string): Promise<string[]> {
    const rows = await prisma.courseInstructor.findMany({
      where: { courseId },
      select: { userId: true },
    })
    return rows.map((r) => r.userId)
  }
}
