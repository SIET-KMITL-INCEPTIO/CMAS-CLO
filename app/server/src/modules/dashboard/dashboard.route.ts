import type { FastifyInstance } from "fastify"
import { CourseDataRepository } from "./course-data.repository.js"
import { DashboardController } from "./dashboard.controller.js"
import { DashboardService } from "./dashboard.service.js"

// Design rows #72-#76, plus the two exports that read the same analysis:
// #61 scores and #71 grades (FR-88 — one service, so the numbers cannot disagree).
export async function dashboardRoutes(app: FastifyInstance) {
  const c = new DashboardController(new DashboardService(new CourseDataRepository()))
  const view = { cap: "course.view" } as const
  const results = { cap: "results.export" } as const

  app.get("/dashboard/overview", { config: { access: "authenticated" } }, c.overview)
  app.get("/courses/:courseId/dashboard/attainment", { config: { access: view } }, c.attainment)
  app.get("/courses/:courseId/dashboard/at-risk", { config: { access: view } }, c.atRisk)
  app.get(
    "/courses/:courseId/dashboard/students/:studentId",
    { config: { access: view } },
    c.student,
  )
  app.get("/courses/:courseId/dashboard/export", { config: { access: results } }, c.dashboardExport)
  app.get("/courses/:courseId/grades/export", { config: { access: results } }, c.gradesExport)
  app.get(
    "/courses/:courseId/scores/export",
    { config: { access: { cap: "score.export" } } },
    c.scoresExport,
  )
}
