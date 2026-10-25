import type { FastifyInstance } from "fastify"
import { EventsController } from "./events.controller.js"
import { events } from "./events.service.js"

// The stream carries course ids only; each one is filtered per subscriber in EventService.
export async function eventsRoutes(app: FastifyInstance) {
  const c = new EventsController(events)

  app.get("/", { config: { access: "authenticated" } }, c.stream)
}
