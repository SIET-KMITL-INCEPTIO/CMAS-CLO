/**
 * Course.revision (0012): one number that moves after every successful write
 * to a course, so the Excel add-in can poll cheaply and reload only on change.
 */
import { prisma } from "../../db/prisma.js"

export class CourseRevisionRepository {
  /**
   * Raw SQL on purpose: a Prisma update would also move Course.updatedAt
   * (@updatedAt), which means "the course's settings changed". A course that
   * no longer exists (just deleted) updates no row, which is fine. Returns the new
   * number (null for a course that is gone).
   */
  async bump(courseId: string): Promise<number | null> {
    const rows = await prisma.$queryRaw<{ revision: number }[]>`
      UPDATE "Course" SET "revision" = "revision" + 1 WHERE "id" = ${courseId} RETURNING "revision"`
    return rows[0]?.revision ?? null
  }

  async read(courseId: string): Promise<number | null> {
    const row = await prisma.course.findUnique({
      where: { id: courseId },
      select: { revision: true },
    })
    return row?.revision ?? null
  }

  /** What the score workbook is named and titled after. */
  async label(courseId: string) {
    return prisma.course.findUnique({
      where: { id: courseId },
      select: { code: true, name: true, section: true, semester: true, year: true },
    })
  }
}
