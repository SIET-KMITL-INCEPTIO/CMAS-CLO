/** Student (an enrolment, not a person — ASM-01), RemediationPlan and roster imports. */
import { Prisma } from "@prisma/client"
import { prisma } from "../../db/prisma.js"
import { ConflictError } from "../../lib/errors.js"

export const STUDENT_SELECT = {
  id: true,
  courseId: true,
  studentCode: true,
  name: true,
  status: true,
  withdrawnAt: true,
} satisfies Prisma.StudentSelect
export type StudentRow = Prisma.StudentGetPayload<{ select: typeof STUDENT_SELECT }>

const DUPLICATE_CODE = "รหัสนักศึกษานี้มีอยู่แล้วในรายวิชา"

async function uniqueCode<T>(write: Promise<T>): Promise<T> {
  try {
    return await write
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError(DUPLICATE_CODE)
    }
    throw err
  }
}

export class StudentRepository {
  async list(
    where: Prisma.StudentWhereInput,
    orderBy: Prisma.StudentOrderByWithRelationInput,
    skip: number,
    take: number,
  ) {
    const [total, rows] = await prisma.$transaction([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        orderBy,
        skip,
        take,
        select: { ...STUDENT_SELECT, _count: { select: { scores: true } } },
      }),
    ])
    return { total, rows }
  }

  countActivities(courseId: string) {
    return prisma.activity.count({ where: { courseId } })
  }

  findById(id: string) {
    return prisma.student.findUnique({
      where: { id },
      select: { ...STUDENT_SELECT, grade: { select: { id: true } } },
    })
  }

  codesInCourse(courseId: string) {
    return prisma.student.findMany({ where: { courseId }, select: { studentCode: true } })
  }

  create(courseId: string, data: { studentCode: string; name: string }) {
    return uniqueCode(
      prisma.student.create({ data: { ...data, courseId }, select: STUDENT_SELECT }),
    )
  }

  update(id: string, data: Prisma.StudentUpdateInput) {
    return uniqueCode(prisma.student.update({ where: { id }, data, select: STUDENT_SELECT }))
  }

  async deleteImpact(id: string) {
    const [scores, grades] = await prisma.$transaction([
      prisma.score.count({ where: { studentId: id } }),
      prisma.studentGrade.count({ where: { studentId: id } }),
    ])
    return { scores, grades }
  }

  async delete(id: string) {
    await prisma.student.delete({ where: { id } })
  }

  /** UC 7.1: the accepted rows, the log row and its rejects, in one transaction (FR-68). */
  commitRoster(
    courseId: string,
    userId: string,
    fileName: string,
    add: { studentCode: string; name: string }[],
    rejects: { row: number; studentCode: string; field: string; value: string; reason: string }[],
  ) {
    return prisma.$transaction(async (tx) => {
      // skipDuplicates: a code another upload added since the preview is left as it is.
      const added = await tx.student.createMany({
        data: add.map((s) => ({ ...s, courseId })),
        skipDuplicates: true,
      })
      const log = await tx.scoreUploadLog.create({
        data: {
          courseId,
          uploadedBy: userId,
          fileName,
          kind: "ROSTER",
          recordsOk: added.count,
          recordsFail: rejects.length,
          rejects: { create: rejects },
        },
        select: { id: true },
      })
      return { uploadLogId: log.id, recordsOk: added.count, recordsFail: rejects.length }
    })
  }

  // ── remediation plans ──

  cloInCourse(cloId: string, courseId: string) {
    return prisma.cLO.findFirst({ where: { id: cloId, courseId }, select: { id: true } })
  }

  upsertPlan(studentId: string, cloId: string, plan: string, userId: string) {
    return prisma.remediationPlan.upsert({
      where: { studentId_cloId: { studentId, cloId } },
      create: { studentId, cloId, plan, updatedBy: userId },
      update: { plan, updatedBy: userId },
      select: {
        studentId: true,
        cloId: true,
        plan: true,
        updatedAt: true,
        editor: { select: { id: true, name: true } },
      },
    })
  }

  deletePlan(studentId: string, cloId: string) {
    return prisma.remediationPlan.deleteMany({ where: { studentId, cloId } })
  }

  courseHeader(courseId: string) {
    return prisma.course.findUniqueOrThrow({
      where: { id: courseId },
      select: {
        code: true,
        name: true,
        section: true,
        semester: true,
        year: true,
        instructors: { select: { user: { select: { name: true } } } },
      },
    })
  }
}
