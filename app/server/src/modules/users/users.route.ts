import type { FastifyInstance } from "fastify"
import { AuthEventRepository } from "./auth-event.repository.js"
import { UserRepository } from "./user.repository.js"
import { UsersController } from "./users.controller.js"
import { UsersService } from "./users.service.js"

// Account management is ADMIN-only (FR-05), including the pending-approval
// list and approval action this module adds for FR-08.
export async function usersRoutes(app: FastifyInstance) {
  const controller = new UsersController(
    new UsersService(new UserRepository(), new AuthEventRepository()),
  )
  const access = { cap: "user.manage" } as const

  app.get("/", { config: { access } }, controller.list)
  app.patch("/:id/approve", { config: { access } }, controller.approve)
  app.get("/:userId", { config: { access } }, controller.get)
  app.patch("/:userId", { config: { access } }, controller.update)
  app.patch("/:userId/status", { config: { access } }, controller.setStatus)
  app.get("/:userId/auth-events", { config: { access } }, controller.authEvents)
}
