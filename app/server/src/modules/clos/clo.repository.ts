/** CLO and BehavioralObjective rows (design #25-#33). */
import { Prisma } from "@prisma/client"
import { prisma } from "../../db/prisma.js"
import { ConflictError } from "../../lib/errors.js"

const CLO_SELECT = {
  id: true,
  courseId: true,
  number: true,
  description: true,
  weight: true,
  bloomLevel: true,
  soloLevel: true,
  levelSource: true,
  objectives: { select: { id: true, _count: { select: { criteria: true } } } },
} satisfies Prisma.CLOSelect
export type CloRow = Prisma.CLOGetPayload<{ select: typeof CLO_SELECT }>

const OBJECTIVE_SELECT = {
  id: true,
  cloId: true,
  number: true,
  description: true,
  weight: true,
  clo: { select: { number: true } },
  criteria: { select: { activityId: true } },
} satisfies Prisma.BehavioralObjectiveSelect
export type ObjectiveRow = Prisma.BehavioralObjectiveGetPayload<{ select: typeof OBJECTIVE_SELECT }>

/** P2002 here is always the (parent, number) key: two "CLO 1" in a course corrupt every report. */
async function uniqueNumber<T>(write: Promise<T>, message: string): Promise<T> {
  try {
    return await write
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError(message)
    }
    throw err
  }
}

const DUPLICATE_CLO = "เลข CLO นี้มีอยู่แล้วในรายวิชา"
const DUPLICATE_OBJECTIVE = "เลขจุดประสงค์นี้มีอยู่แล้วใน CLO"

export class CloRepository {
  listByCourse(courseId: string) {
    return prisma.cLO.findMany({
      where: { courseId },
      orderBy: { number: "asc" },
      select: CLO_SELECT,
    })
  }

  findById(id: string) {
    return prisma.cLO.findUnique({ where: { id }, select: CLO_SELECT })
  }

  /** What CR-02 needs: activity weights and every criteria cell of the course. */
  async weightInputs(courseId: string) {
    const [activities, cells, objectives, course] = await prisma.$transaction([
      prisma.activity.findMany({ where: { courseId }, select: { id: true, weight: true } }),
      prisma.assessmentCriteria.findMany({
        where: { activity: { courseId } },
        select: { activityId: true, objectiveId: true, weight: true },
      }),
      prisma.behavioralObjective.findMany({
        where: { clo: { courseId } },
        select: { id: true, cloId: true },
      }),
      prisma.course.findUniqueOrThrow({ where: { id: courseId }, select: { cloPassMark: true } }),
    ])
    return {
      activities,
      cells,
      cloOfObjective: new Map(objectives.map((o) => [o.id, o.cloId])),
      cloPassMark: course.cloPassMark,
    }
  }

  create(courseId: string, data: Omit<Prisma.CLOUncheckedCreateInput, "courseId">) {
    return uniqueNumber(
      prisma.cLO.create({ data: { ...data, courseId }, select: CLO_SELECT }),
      DUPLICATE_CLO,
    )
  }

  update(id: string, data: Prisma.CLOUncheckedUpdateInput) {
    return uniqueNumber(
      prisma.cLO.update({ where: { id }, data, select: CLO_SELECT }),
      DUPLICATE_CLO,
    )
  }

  /**
   * Renumber in one transaction, in two passes: first every CLO moves far out
   * of the way (+1000, still > 0 for the CHECK), then to its place — so the
   * (courseId, number) key never sees two rows on one number midway.
   */
  async renumber(courseId: string, order: string[]) {
    await prisma.$transaction([
      prisma.cLO.updateMany({ where: { courseId }, data: { number: { increment: 1000 } } }),
      ...order.map((id, i) => prisma.cLO.update({ where: { id }, data: { number: i + 1 } })),
    ])
  }

  /** What deleting a CLO takes with it (FR-36). */
  async deleteImpact(cloId: string) {
    const [objectives, criteria, activities] = await prisma.$transaction([
      prisma.behavioralObjective.count({ where: { cloId } }),
      prisma.assessmentCriteria.count({ where: { objective: { cloId } } }),
      prisma.activity.count({ where: { criteria: { some: { objective: { cloId } } } } }),
    ])
    return { objectives, criteria, activities }
  }

  async delete(id: string) {
    await prisma.cLO.delete({ where: { id } })
  }

  // ── objectives ──

  listObjectives(cloId: string) {
    return prisma.behavioralObjective.findMany({
      where: { cloId },
      orderBy: { number: "asc" },
      select: OBJECTIVE_SELECT,
    })
  }

  findObjective(id: string) {
    return prisma.behavioralObjective.findUnique({ where: { id }, select: OBJECTIVE_SELECT })
  }

  createObjective(
    cloId: string,
    data: { number: number; description: string; weight?: number | null },
  ) {
    return uniqueNumber(
      prisma.behavioralObjective.create({ data: { ...data, cloId }, select: OBJECTIVE_SELECT }),
      DUPLICATE_OBJECTIVE,
    )
  }

  updateObjective(id: string, data: Prisma.BehavioralObjectiveUncheckedUpdateInput) {
    return uniqueNumber(
      prisma.behavioralObjective.update({ where: { id }, data, select: OBJECTIVE_SELECT }),
      DUPLICATE_OBJECTIVE,
    )
  }

  countObjectiveCriteria(objectiveId: string) {
    return prisma.assessmentCriteria.count({ where: { objectiveId } })
  }

  async deleteObjective(id: string) {
    await prisma.behavioralObjective.delete({ where: { id } })
  }
}
