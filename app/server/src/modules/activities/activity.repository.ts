/**
 * Activity, AssessmentCriteria and CourseGroupWeight rows (design #34-#44).
 * Every multi-row write is one transaction; GROUP-mode weights are re-split
 * inside the same transaction that changed what they depend on.
 */
import { Prisma } from "@prisma/client"
import { prisma } from "../../db/prisma.js"
import { splitGroupWeights } from "../../lib/weights.js"
import { writeCells, type CellWrite } from "../scores/score-writer.js"

export const ACTIVITY_SELECT = {
  id: true,
  courseId: true,
  order: true,
  name: true,
  type: true,
  typeLabel: true,
  assessmentMethod: true,
  assessmentLabel: true,
  criteriaNote: true,
  maxScore: true,
  passScore: true,
  passMark: true,
  weight: true,
  closedAt: true,
} satisfies Prisma.ActivitySelect
export type ActivityRow = Prisma.ActivityGetPayload<{ select: typeof ACTIVITY_SELECT }>

type Tx = Prisma.TransactionClient

/** GROUP mode: re-split the stored group weights over the course's activities by maxScore. */
async function resplit(tx: Tx, courseId: string) {
  const course = await tx.course.findUniqueOrThrow({
    where: { id: courseId },
    select: { weightMode: true, groupWeights: { select: { type: true, weight: true } } },
  })
  if (course.weightMode !== "GROUP") return
  const activities = await tx.activity.findMany({
    where: { courseId },
    select: { id: true, type: true, typeLabel: true, maxScore: true },
    orderBy: { order: "asc" },
  })
  const groups = Object.fromEntries(course.groupWeights.map((g) => [g.type, g.weight]))
  const split = splitGroupWeights(activities, groups)
  for (const [id, weight] of split) await tx.activity.update({ where: { id }, data: { weight } })
}

export class ActivityRepository {
  async list(courseId: string) {
    const [activities, course, enrolled, scored] = await prisma.$transaction([
      prisma.activity.findMany({
        where: { courseId },
        orderBy: { order: "asc" },
        select: ACTIVITY_SELECT,
      }),
      prisma.course.findUniqueOrThrow({
        where: { id: courseId },
        select: { weightMode: true, groupWeights: { select: { type: true, weight: true } } },
      }),
      prisma.student.count({ where: { courseId, status: "ENROLLED" } }),
      prisma.score.groupBy({
        by: ["activityId"],
        where: { activity: { courseId }, student: { status: "ENROLLED" } },
        _count: { _all: true },
        orderBy: { activityId: "asc" },
      }),
    ])
    const scoredBy = new Map(scored.map((s) => [s.activityId, (s._count as { _all: number })._all]))
    return { activities, course, enrolled, scoredBy }
  }

  findById(id: string) {
    return prisma.activity.findUnique({ where: { id }, select: ACTIVITY_SELECT })
  }

  weightMode(courseId: string) {
    return prisma.course
      .findUniqueOrThrow({ where: { id: courseId }, select: { weightMode: true } })
      .then((c) => c.weightMode)
  }

  /** Σ weight of the course's activities, leaving one out (the one being edited). */
  async otherWeights(courseId: string, exceptId?: string) {
    const agg = await prisma.activity.aggregate({
      where: { courseId, ...(exceptId ? { id: { not: exceptId } } : {}) },
      _sum: { weight: true },
    })
    return agg._sum.weight ?? 0
  }

  orders(courseId: string) {
    return prisma.activity.findMany({ where: { courseId }, select: { id: true, order: true } })
  }

  /** The method and label last saved for a custom type name in this course (design #35). */
  lastForCustomType(courseId: string, typeLabel: string) {
    return prisma.activity.findFirst({
      where: { courseId, type: "CUSTOM", typeLabel },
      orderBy: { order: "desc" },
      select: { assessmentMethod: true, assessmentLabel: true },
    })
  }

  maxExistingScore(activityId: string) {
    return prisma.score.aggregate({
      where: { activityId, status: "SCORED" },
      _max: { score: true },
      _count: { _all: true },
    })
  }

  countScoresAbove(activityId: string, maxScore: number) {
    return prisma.score.count({ where: { activityId, score: { gt: maxScore } } })
  }

  countScores(activityId: string) {
    return prisma.score.count({ where: { activityId } })
  }

  create(data: Prisma.ActivityUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.activity.create({ data, select: { id: true } })
      await resplit(tx, data.courseId)
      return tx.activity.findUniqueOrThrow({ where: { id: created.id }, select: ACTIVITY_SELECT })
    })
  }

  update(id: string, courseId: string, data: Prisma.ActivityUncheckedUpdateInput) {
    return prisma.$transaction(async (tx) => {
      await tx.activity.update({ where: { id }, data })
      await resplit(tx, courseId)
      return tx.activity.findUniqueOrThrow({ where: { id }, select: ACTIVITY_SELECT })
    })
  }

  /** Cascades to Score, AssessmentCriteria and ScoreChange (design #38). */
  delete(id: string, courseId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.activity.delete({ where: { id } })
      await resplit(tx, courseId)
    })
  }

  async reorder(order: string[]) {
    await prisma.$transaction(
      order.map((id, i) => prisma.activity.update({ where: { id }, data: { order: i } })),
    )
  }

  /** Design #41: same settings and objective links, no scores, weight 0, at the end. */
  duplicate(source: ActivityRow, order: number) {
    return prisma.$transaction(async (tx) => {
      const criteria = await tx.assessmentCriteria.findMany({
        where: { activityId: source.id },
        select: { objectiveId: true, weight: true },
      })
      const { id: _id, courseId, closedAt: _closed, ...settings } = source
      const created = await tx.activity.create({
        data: {
          ...settings,
          courseId,
          name: `${source.name} (สำเนา)`.slice(0, 200),
          weight: 0,
          order,
          criteria: { create: criteria },
        },
        select: { id: true },
      })
      await resplit(tx, courseId)
      return tx.activity.findUniqueOrThrow({ where: { id: created.id }, select: ACTIVITY_SELECT })
    })
  }

  // ── criteria matrix (design #39-#40) ──

  matrix(courseId: string) {
    return prisma.$transaction([
      prisma.behavioralObjective.findMany({
        where: { clo: { courseId } },
        orderBy: [{ clo: { number: "asc" } }, { number: "asc" }],
        select: {
          id: true,
          cloId: true,
          number: true,
          weight: true,
          clo: { select: { number: true } },
        },
      }),
      prisma.activity.findMany({
        where: { courseId },
        orderBy: { order: "asc" },
        select: { id: true, name: true, weight: true },
      }),
      prisma.assessmentCriteria.findMany({
        where: { activity: { courseId } },
        select: { activityId: true, objectiveId: true, weight: true },
      }),
      prisma.cLO.findMany({ where: { courseId }, select: { id: true, weight: true } }),
    ])
  }

  /** FR-44: the matrix is replaced as a whole; a cell left out is deleted. */
  async replaceMatrix(
    courseId: string,
    cells: { activityId: string; objectiveId: string; weight: number }[],
  ) {
    await prisma.$transaction([
      prisma.assessmentCriteria.deleteMany({ where: { activity: { courseId } } }),
      prisma.assessmentCriteria.createMany({ data: cells }),
    ])
  }

  // ── group weights (design #42) ──

  groupInputs(courseId: string) {
    return prisma.activity.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      select: { id: true, type: true, typeLabel: true, maxScore: true },
    })
  }

  setWeightMode(courseId: string, mode: "MANUAL" | "GROUP", weights: Record<string, number>) {
    return prisma.$transaction(async (tx) => {
      await tx.course.update({ where: { id: courseId }, data: { weightMode: mode } })
      if (mode === "GROUP") {
        // Rows are kept when switching back to MANUAL; replaced only when GROUP is saved.
        await tx.courseGroupWeight.deleteMany({ where: { courseId } })
        await tx.courseGroupWeight.createMany({
          data: Object.entries(weights).map(([type, weight]) => ({ courseId, type, weight })),
        })
        await resplit(tx, courseId)
      }
      return tx.activity.findMany({
        where: { courseId },
        orderBy: { order: "asc" },
        select: { id: true, weight: true },
      })
    })
  }

  // ── close / reopen (design #43-#44) ──

  /**
   * R3: closing decides the empty cells of enrolled students — 0, excused, or
   * left for later — and records each decision as a ScoreChange (A-12).
   */
  close(
    activityId: string,
    courseId: string,
    blank: "ZERO" | "EXCUSED" | "LATER",
    reason: string | null,
    actorId: string,
  ) {
    return prisma.$transaction(
      async (tx) => {
        const closedAt = new Date()
        await tx.activity.update({ where: { id: activityId }, data: { closedAt } })
        const empty = await tx.student.findMany({
          where: { courseId, status: "ENROLLED", scores: { none: { activityId } } },
          select: { id: true },
        })
        if (blank === "LATER" || empty.length === 0) {
          return { closedAt, zeroed: 0, excused: 0, pending: empty.length }
        }
        const writes: CellWrite[] = empty.map((s) => ({
          studentId: s.id,
          activityId,
          from: null,
          to: blank === "ZERO" ? { score: 0, excused: false } : { excused: true, reason },
        }))
        await writeCells(tx, writes, "CLOSE", actorId)
        return {
          closedAt,
          zeroed: blank === "ZERO" ? empty.length : 0,
          excused: blank === "EXCUSED" ? empty.length : 0,
          pending: 0,
        }
      },
      { timeout: 30_000 },
    )
  }

  async reopen(activityId: string) {
    await prisma.activity.update({ where: { id: activityId }, data: { closedAt: null } })
  }
}
