import type { FastifyInstance } from "fastify"
import { CourseDataRepository } from "../dashboard/course-data.repository.js"
import { GradingController } from "./grading.controller.js"
import { GradingRepository } from "./grading.repository.js"
import { GradingService } from "./grading.service.js"

// Design rows #65-#70. #71 (export) lives with the other exports in modules/dashboard.
export async function gradingRoutes(app: FastifyInstance) {
  const c = new GradingController(
    new GradingService(new CourseDataRepository(), new GradingRepository()),
  )
  const run = { cap: "grading.run" } as const
  const override = { cap: "grade.override" } as const

  app.get("/courses/:courseId/grading", { config: { access: { cap: "course.view" } } }, c.get)
  app.put(
    "/courses/:courseId/grade-bands",
    { config: { access: { cap: "band.write" } } },
    c.saveBands,
  )
  app.post("/courses/:courseId/grading/run", { config: { access: run } }, c.run)
  app.delete("/courses/:courseId/grading", { config: { access: run } }, c.unfreeze)
  app.put("/students/:studentId/grade-override", { config: { access: override } }, c.override)
  app.delete(
    "/students/:studentId/grade-override",
    { config: { access: override } },
    c.clearOverride,
  )
}
