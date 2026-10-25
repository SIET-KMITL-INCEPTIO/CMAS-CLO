import type { FastifyInstance, FastifyRequest } from "fastify"
import { StudentRepository } from "./student.repository.js"
import { StudentController } from "./students.controller.js"
import { StudentService } from "./students.service.js"

// S-5: an import parses up to 10 MB in memory — 10 a minute per signed-in user, not per IP.
export const IMPORT_LIMIT = {
  max: 10,
  timeWindow: "1 minute",
  keyGenerator: (req: FastifyRequest) => req.headers.authorization ?? req.ip,
}

// Design rows #45-#55. Mounted at the API root (collection under a course, items top level).
export async function studentsRoutes(app: FastifyInstance) {
  const c = new StudentController(new StudentService(new StudentRepository()))
  const view = { cap: "course.view" } as const
  const write = { cap: "student.write" } as const

  app.get("/courses/:courseId/students", { config: { access: view } }, c.list)
  app.post("/courses/:courseId/students", { config: { access: write } }, c.create)
  app.patch("/students/:studentId", { config: { access: write } }, c.update)
  app.delete("/students/:studentId", { config: { access: { cap: "student.delete" } } }, c.remove)
  app.get(
    "/courses/:courseId/students/template",
    { config: { access: { cap: "score.export" } } },
    c.template,
  )
  app.post(
    "/courses/:courseId/students/import/preview",
    { config: { access: write, rateLimit: IMPORT_LIMIT } },
    c.previewImport,
  )
  app.post(
    "/courses/:courseId/students/import/commit",
    { config: { access: write } },
    c.commitImport,
  )
  app.post("/students/:studentId/withdraw", { config: { access: write } }, c.withdraw)
  app.post("/students/:studentId/restore", { config: { access: write } }, c.restore)
  app.put(
    "/students/:studentId/remediation-plans/:cloId",
    { config: { access: write } },
    c.savePlan,
  )
  app.delete(
    "/students/:studentId/remediation-plans/:cloId",
    { config: { access: write } },
    c.deletePlan,
  )
}
