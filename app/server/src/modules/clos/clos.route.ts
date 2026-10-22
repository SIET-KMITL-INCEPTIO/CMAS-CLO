import type { FastifyInstance } from "fastify"
import { CloRepository } from "./clo.repository.js"
import { CloController } from "./clos.controller.js"
import { CloService } from "./clos.service.js"

// Design rows #25-#33. Mounted at the API root because the collection lives
// under a course and each item at the top level (api-design §1.2). The leaf
// routes find their course through the A-3 resolver before anything here runs.
export async function closRoutes(app: FastifyInstance) {
  const c = new CloController(new CloService(new CloRepository()))
  const view = { cap: "course.view" } as const
  const write = { cap: "clo.write" } as const

  app.get("/courses/:courseId/clos", { config: { access: view } }, c.list)
  app.post("/courses/:courseId/clos", { config: { access: write } }, c.create)
  app.patch("/courses/:courseId/clos/reorder", { config: { access: write } }, c.reorder)
  app.patch("/clos/:cloId", { config: { access: write } }, c.update)
  app.delete("/clos/:cloId", { config: { access: write } }, c.remove)
  app.get("/clos/:cloId/objectives", { config: { access: view } }, c.objectives)
  app.post("/clos/:cloId/objectives", { config: { access: write } }, c.createObjective)
  app.patch("/objectives/:objectiveId", { config: { access: write } }, c.updateObjective)
  app.delete("/objectives/:objectiveId", { config: { access: write } }, c.removeObjective)
}
