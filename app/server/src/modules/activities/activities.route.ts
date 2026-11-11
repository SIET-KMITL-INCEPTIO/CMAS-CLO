import type { FastifyInstance } from "fastify"
import { ActivityRepository } from "./activity.repository.js"
import { ActivityController } from "./activities.controller.js"
import { ActivityService } from "./activities.service.js"

// Design rows #34-#44. Mounted at the API root: collections under a course,
// items at the top level, leaf ids resolved to their course by the access hook (A-3).
export async function activitiesRoutes(app: FastifyInstance) {
  const c = new ActivityController(new ActivityService(new ActivityRepository()))
  const view = { cap: "course.view" } as const
  const write = { cap: "activity.write" } as const
  const scores = { cap: "score.edit" } as const

  app.get("/courses/:courseId/activities", { config: { access: view } }, c.list)
  app.post("/courses/:courseId/activities", { config: { access: write } }, c.create)
  app.patch("/courses/:courseId/activities/reorder", { config: { access: write } }, c.reorder)
  app.patch("/activities/:activityId", { config: { access: write } }, c.update)
  app.delete(
    "/activities/:activityId",
    { config: { access: { cap: "activity.delete" } } },
    c.remove,
  )
  app.get("/courses/:courseId/criteria", { config: { access: view } }, c.criteria)
  app.put("/courses/:courseId/criteria", { config: { access: write } }, c.replaceCriteria)
  app.post("/activities/:activityId/duplicate", { config: { access: write } }, c.duplicate)
  app.put("/courses/:courseId/group-weights", { config: { access: write } }, c.groupWeights)
  app.post("/activities/:activityId/close", { config: { access: scores } }, c.close)
  app.post("/activities/:activityId/reopen", { config: { access: scores } }, c.reopen)
}
