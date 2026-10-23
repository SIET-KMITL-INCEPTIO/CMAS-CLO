import type { FastifyInstance } from "fastify"
import { IMPORT_LIMIT } from "../students/students.route.js"
import { ScoreRepository } from "./score.repository.js"
import { ScoreController } from "./scores.controller.js"
import { ScoreService } from "./scores.service.js"

// Design rows #56-#60 and #62-#64. #61 (export) lives with the dashboard: it reads
// the same attainment service (FR-88).
export async function scoresRoutes(app: FastifyInstance) {
  const c = new ScoreController(new ScoreService(new ScoreRepository()))
  const view = { cap: "course.view" } as const

  app.get("/courses/:courseId/scores", { config: { access: view } }, c.grid)
  app.put("/courses/:courseId/scores", { config: { access: { cap: "score.edit" } } }, c.put)
  app.get(
    "/courses/:courseId/scores/template",
    { config: { access: { cap: "score.export" } } },
    c.template,
  )
  app.post(
    "/courses/:courseId/scores/import/preview",
    { config: { access: { cap: "score.import" }, rateLimit: IMPORT_LIMIT } },
    c.previewImport,
  )
  app.post(
    "/courses/:courseId/scores/import/commit",
    { config: { access: { cap: "score.import" } } },
    c.commitImport,
  )
  app.get("/courses/:courseId/uploads", { config: { access: view } }, c.uploads)
  app.get("/uploads/:uploadId/errors", { config: { access: view } }, c.uploadErrors)
  app.get("/courses/:courseId/score-changes", { config: { access: view } }, c.changes)
}
