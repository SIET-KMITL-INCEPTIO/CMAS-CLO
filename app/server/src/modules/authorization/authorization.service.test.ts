import { describe, expect, it, vi } from "vitest"
import { ForbiddenError } from "../../lib/errors.js"
import { authorize, CourseNotFoundError, type Caller } from "./authorization.service.js"

const instructor: Caller = { userId: "u-teacher", role: "INSTRUCTOR" }
const admin: Caller = { userId: "u-admin", role: "ADMIN" }
const sees = vi.fn(async () => true)
const blind = vi.fn(async () => false)

describe("authorize()", () => {
  it("lets an instructor of the course do teaching work", async () => {
    await expect(authorize("score.edit", "c1", instructor, sees)).resolves.toBeUndefined()
  })

  it("answers 404 for a course the instructor does not teach, whatever the capability", async () => {
    for (const cap of ["course.view", "score.edit", "staff.write", "course.delete"] as const) {
      await expect(authorize(cap, "c1", instructor, blind)).rejects.toBeInstanceOf(
        CourseNotFoundError,
      )
    }
  })

  it("answers 404 when a course capability has no course id", async () => {
    await expect(authorize("course.view", null, admin, sees)).rejects.toBeInstanceOf(
      CourseNotFoundError,
    )
  })

  // D-1: ADMIN is not an instructor.
  it("lets ADMIN read any course but refuses teaching work with 403", async () => {
    await expect(authorize("course.view", "c1", admin, sees)).resolves.toBeUndefined()
    for (const cap of ["score.edit", "clo.write", "grading.run", "student.write"] as const) {
      await expect(authorize(cap, "c1", admin, sees)).rejects.toBeInstanceOf(ForbiddenError)
    }
  })

  it("lets ADMIN run course administration", async () => {
    await expect(authorize("staff.write", "c1", admin, sees)).resolves.toBeUndefined()
    await expect(authorize("course.delete", "c1", admin, sees)).resolves.toBeUndefined()
    await expect(authorize("course.create", null, admin)).resolves.toBeUndefined()
  })

  it("keeps account management for ADMIN", async () => {
    await expect(authorize("user.manage", null, admin)).resolves.toBeUndefined()
    await expect(authorize("user.manage", null, instructor)).rejects.toBeInstanceOf(ForbiddenError)
  })

  it("does not look up a course for a system capability", async () => {
    const lookup = vi.fn(async () => true)
    await authorize("course.create", null, instructor, lookup)
    expect(lookup).not.toHaveBeenCalled()
  })
})
