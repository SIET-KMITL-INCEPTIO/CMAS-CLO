import { beforeEach, describe, expect, it, vi } from "vitest"

const prisma = vi.hoisted(() => ({
  course: { findFirst: vi.fn() },
  cLO: { findUnique: vi.fn() },
  activity: { findUnique: vi.fn() },
  student: { findUnique: vi.fn() },
  scoreUploadLog: { findUnique: vi.fn() },
  behavioralObjective: { findUnique: vi.fn() },
}))
vi.mock("../../db/prisma.js", () => ({ prisma }))

import { CourseAccessRepository } from "./course-access.repository.js"

/** The two lookups behind every course-scoped request: who may see a course, and which course a leaf row is in. */
const repo = new CourseAccessRepository()
beforeEach(() => vi.clearAllMocks())

describe("isVisible", () => {
  it("an ADMIN is matched on the course id alone", async () => {
    prisma.course.findFirst.mockResolvedValue({ id: "c1" })
    expect(await repo.isVisible("c1", "u1", true)).toBe(true)
    expect(prisma.course.findFirst.mock.calls[0]![0].where).toEqual({ id: "c1" })
  })

  it("anyone else needs a CourseInstructor row for their own id", async () => {
    prisma.course.findFirst.mockResolvedValue(null)
    expect(await repo.isVisible("c1", "u1", false)).toBe(false)
    expect(prisma.course.findFirst.mock.calls[0]![0].where).toEqual({
      id: "c1",
      instructors: { some: { userId: "u1" } },
    })
  })
})

describe("courseIdOf", () => {
  it.each([
    ["cloId", prisma.cLO],
    ["activityId", prisma.activity],
    ["studentId", prisma.student],
    ["uploadId", prisma.scoreUploadLog],
  ] as const)("%s reads the courseId off its own table", async (param, table) => {
    table.findUnique.mockResolvedValue({ courseId: "c9" })
    expect(await repo.courseIdOf(param, "x")).toBe("c9")
    expect(table.findUnique).toHaveBeenCalledWith({
      where: { id: "x" },
      select: { courseId: true },
    })
  })

  it("an objective reaches the course through its CLO", async () => {
    prisma.behavioralObjective.findUnique.mockResolvedValue({ clo: { courseId: "c7" } })
    expect(await repo.courseIdOf("objectiveId", "o1")).toBe("c7")
  })

  it("a row that does not exist gives null, never a guess", async () => {
    prisma.cLO.findUnique.mockResolvedValue(null)
    prisma.behavioralObjective.findUnique.mockResolvedValue(null)
    expect(await repo.courseIdOf("cloId", "nope")).toBeNull()
    expect(await repo.courseIdOf("objectiveId", "nope")).toBeNull()
  })
})
