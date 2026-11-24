/**
 * FR-76: the course revision the Excel add-in polls moves after every
 * successful write to a course, and only then.
 */
import type { FastifyReply, FastifyRequest } from "fastify"
import { beforeEach, describe, expect, it, vi } from "vitest"

const bump = vi.hoisted(() => vi.fn(async (_courseId: string) => {}))
const courseChanged = vi.hoisted(() => vi.fn(async () => {}))

vi.mock("../repositories/course-revision.repository.js", () => ({
  CourseRevisionRepository: class {
    bump = bump
  },
}))
vi.mock("../modules/events/events.service.js", () => ({ events: { courseChanged } }))

const { publishCourseChange } = await import("./live-updates.middleware.js")

const request = (over: Partial<FastifyRequest> = {}) =>
  ({
    method: "PUT",
    userId: "u1",
    courseId: "c1",
    headers: {},
    log: { error: vi.fn() },
    ...over,
  }) as unknown as FastifyRequest
const reply = (statusCode: number) => ({ statusCode }) as FastifyReply

beforeEach(() => {
  bump.mockClear()
  courseChanged.mockClear()
})

describe("publishCourseChange", () => {
  it("moves the revision, then tells the open tabs, after a successful write", async () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      bump.mockClear()
      await publishCourseChange(request({ method }), reply(200))
      expect(bump, method).toHaveBeenCalledWith("c1")
    }
    expect(courseChanged).toHaveBeenCalled()
  })

  it("leaves it alone after a read or a refused write", async () => {
    await publishCourseChange(request({ method: "GET" }), reply(200))
    await publishCourseChange(request(), reply(409))
    await publishCourseChange(request(), reply(422))
    expect(bump).not.toHaveBeenCalled()
  })

  it("leaves it alone when there is no course or no caller", async () => {
    await publishCourseChange(request({ courseId: undefined }), reply(200))
    await publishCourseChange(request({ userId: undefined }), reply(200))
    expect(bump).not.toHaveBeenCalled()
  })

  it("names a course that was just created", async () => {
    await publishCourseChange(
      request({ method: "POST", courseId: undefined, createdCourseId: "c9" }),
      reply(201),
    )
    expect(bump).toHaveBeenCalledWith("c9")
  })

  it("still tells the tabs when the revision cannot be written", async () => {
    bump.mockRejectedValueOnce(new Error("db down"))
    const req = request()
    await publishCourseChange(req, reply(200))
    expect(courseChanged).toHaveBeenCalled()
    expect(req.log.error).toHaveBeenCalled()
  })
})
