/** Score, ScoreUploadLog, UploadReject and ScoreChange reads; every write goes through writeCells (A-12). */
import { Prisma, type ScoreChangeSource } from "@prisma/client"
import { prisma } from "../../db/prisma.js"
import { cellOf, writeCells, type CellValue, type CellWrite } from "./score-writer.js"

/** `seen` is the cell as the client last showed it (D-3): a number, "EXCUSED" or null. */
export type IncomingCell = {
  studentId: string
  activityId: string
  to: CellValue | null
  seen: number | "EXCUSED" | null
}

const asSeen = (v: CellValue | null) => (v === null ? null : v.excused ? "EXCUSED" : v.score)

export class ScoreRepository {
  async grid(courseId: string, enrolledOnly: boolean, skip: number, take: number) {
    const where: Prisma.StudentWhereInput = {
      courseId,
      ...(enrolledOnly ? { status: "ENROLLED" } : {}),
    }
    const [activities, total, students, progress, enrolled] = await prisma.$transaction([
      prisma.activity.findMany({
        where: { courseId },
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          maxScore: true,
          passScore: true,
          passMark: true,
          closedAt: true,
        },
      }),
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        orderBy: { studentCode: "asc" },
        skip,
        take,
        select: {
          id: true,
          studentCode: true,
          name: true,
          status: true,
          scores: { select: { activityId: true, score: true, status: true, excuseReason: true } },
        },
      }),
      prisma.score.groupBy({
        by: ["activityId"],
        where: { activity: { courseId }, student: { status: "ENROLLED" } },
        _count: { _all: true },
        orderBy: { activityId: "asc" },
      }),
      prisma.student.count({ where: { courseId, status: "ENROLLED" } }),
    ])
    return { activities, total, students, progress, enrolled }
  }

  /** What a write must be checked against: the students and activities it names, inside this course. */
  async context(courseId: string, studentIds: string[], activityIds: string[]) {
    const [students, activities] = await prisma.$transaction([
      prisma.student.findMany({
        where: { courseId, id: { in: studentIds } },
        select: { id: true, studentCode: true, status: true, grade: { select: { id: true } } },
      }),
      prisma.activity.findMany({
        where: { courseId, id: { in: activityIds } },
        select: { id: true, name: true, maxScore: true, closedAt: true },
      }),
    ])
    return { students, activities }
  }

  /**
   * D-3: lock the existing cells, compare each with what the client last saw,
   * and write only if every one still matches — one transaction (FR-63).
   * Returns the cells that changed under the client instead of writing.
   */
  writeIfUnchanged(cells: IncomingCell[], source: ScoreChangeSource, userId: string) {
    return prisma.$transaction(
      async (tx) => {
        const pairs = cells.map((c) => Prisma.sql`(${c.studentId}, ${c.activityId})`)
        const current = await tx.$queryRaw<
          {
            studentId: string
            activityId: string
            score: number | null
            status: string
            excuseReason: string | null
          }[]
        >`SELECT "studentId", "activityId", score, status::text AS status, "excuseReason"
            FROM "Score" WHERE ("studentId", "activityId") IN (${Prisma.join(pairs)}) FOR UPDATE`
        const now = new Map(current.map((r) => [`${r.studentId}|${r.activityId}`, cellOf(r)]))
        const valueOf = (c: IncomingCell) => now.get(`${c.studentId}|${c.activityId}`) ?? null
        const conflicts = cells
          .filter((c) => asSeen(valueOf(c)) !== c.seen)
          .map((c) => ({ studentId: c.studentId, activityId: c.activityId, current: valueOf(c) }))
        if (conflicts.length) return { conflicts, written: 0 }
        // History records what the database held, reason included — not what the client sent.
        const writes: CellWrite[] = cells.map((c) => ({
          studentId: c.studentId,
          activityId: c.activityId,
          from: valueOf(c),
          to: c.to,
        }))
        return { conflicts: [], written: await writeCells(tx, writes, source, userId) }
      },
      { timeout: 30_000 },
    )
  }

  /** FR-68 / FR-71: the accepted cells, the log (even with 0 rows) and its rejects, together. */
  commitImport(
    courseId: string,
    userId: string,
    fileName: string,
    cells: { studentId: string; activityId: string; to: CellValue }[],
    okRows: number,
    failedRows: number,
    /** One per refused cell; a row can have several (FR-68). */
    rejects: { row: number; studentCode: string; field: string; value: string; reason: string }[],
  ) {
    return prisma.$transaction(
      async (tx) => {
        const log = await tx.scoreUploadLog.create({
          data: {
            courseId,
            uploadedBy: userId,
            fileName,
            kind: "SCORE",
            recordsOk: okRows,
            recordsFail: failedRows,
            rejects: { create: rejects },
          },
          select: { id: true },
        })
        if (cells.length) {
          // `from` is read at commit time, so the history shows what was really overwritten.
          const existing = await tx.score.findMany({
            where: { OR: cells.map((c) => ({ studentId: c.studentId, activityId: c.activityId })) },
            select: {
              studentId: true,
              activityId: true,
              score: true,
              status: true,
              excuseReason: true,
            },
          })
          const before = new Map(existing.map((r) => [`${r.studentId}|${r.activityId}`, cellOf(r)]))
          await writeCells(
            tx,
            cells.map((c) => ({
              ...c,
              from: before.get(`${c.studentId}|${c.activityId}`) ?? null,
            })),
            "IMPORT",
            userId,
            log.id,
          )
        }
        return { uploadLogId: log.id, recordsOk: okRows, recordsFail: failedRows }
      },
      { timeout: 60_000 },
    )
  }

  /** Every student and activity of the course, for import matching and the template. */
  roster(courseId: string) {
    return prisma.$transaction([
      prisma.student.findMany({
        where: { courseId },
        orderBy: { studentCode: "asc" },
        select: {
          id: true,
          studentCode: true,
          name: true,
          status: true,
          grade: { select: { id: true } },
        },
      }),
      prisma.activity.findMany({
        where: { courseId },
        orderBy: { order: "asc" },
        select: { id: true, name: true, maxScore: true, closedAt: true },
      }),
    ])
  }

  async uploads(
    courseId: string,
    kind: "SCORE" | "ROSTER" | undefined,
    skip: number,
    take: number,
  ) {
    const where = { courseId, ...(kind ? { kind } : {}) }
    const [total, rows] = await prisma.$transaction([
      prisma.scoreUploadLog.count({ where }),
      prisma.scoreUploadLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          kind: true,
          fileName: true,
          recordsOk: true,
          recordsFail: true,
          createdAt: true,
          uploader: { select: { id: true, name: true } },
        },
      }),
    ])
    return { total, rows }
  }

  uploadRejects(uploadId: string) {
    return prisma.uploadReject.findMany({
      where: { logId: uploadId },
      orderBy: { row: "asc" },
      select: { row: true, studentCode: true, field: true, value: true, reason: true },
    })
  }

  async changes(where: Prisma.ScoreChangeWhereInput, skip: number, take: number) {
    const [total, rows] = await prisma.$transaction([
      prisma.scoreChange.count({ where }),
      prisma.scoreChange.findMany({
        where,
        orderBy: { changedAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          studentId: true,
          activityId: true,
          fromScore: true,
          fromExcused: true,
          toScore: true,
          toExcused: true,
          source: true,
          note: true,
          changedAt: true,
          student: { select: { studentCode: true } },
          activity: { select: { name: true } },
          changer: { select: { id: true, name: true } },
        },
      }),
    ])
    return { total, rows }
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
