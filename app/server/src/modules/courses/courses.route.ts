import type { FastifyInstance } from "fastify"
import { CourseRepository } from "./course.repository.js"
import { CourseController } from "./courses.controller.js"
import { CourseService } from "./courses.service.js"

// Design rows #15-#24. Reads of a course declare course.view; the hook answers
// 404 for a course the caller cannot see before anything here runs.
export async function coursesRoutes(app: FastifyInstance) {
  const c = new CourseController(new CourseService(new CourseRepository()))
  const view = { cap: "course.view" } as const

  app.get("/", { config: { access: "authenticated" } }, c.list)
  app.post("/", { config: { access: { cap: "course.create" } } }, c.create)
  app.get("/:courseId", { config: { access: view } }, c.get)
  app.patch("/:courseId", { config: { access: { cap: "course.settings" } } }, c.update)
  app.delete("/:courseId", { config: { access: { cap: "course.delete" } } }, c.remove)
  app.get("/:courseId/impact", { config: { access: view } }, c.impact)
  app.get("/:courseId/instructors", { config: { access: view } }, c.instructors)
  app.post(
    "/:courseId/instructors",
    { config: { access: { cap: "staff.write" } } },
    c.addInstructor,
  )
  app.delete(
    "/:courseId/instructors/:userId",
    { config: { access: { cap: "staff.write" } } },
    c.removeInstructor,
  )
  // course.create is a system capability: the service checks the caller can see :courseId.
  app.post("/:courseId/duplicate", { config: { access: { cap: "course.create" } } }, c.duplicate)
}
