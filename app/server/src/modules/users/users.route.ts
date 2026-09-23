import type { FastifyInstance } from "fastify"
import { authMiddleware } from "../../middlewares/auth.middleware.js"
import { rbac } from "../../middlewares/rbac.middleware.js"
import { UserRepository } from "./user.repository.js"
import { UsersController } from "./users.controller.js"
import { UsersService } from "./users.service.js"

// Account management is ADMIN-only (FR-05), including the pending-approval
// list and approval action this module adds for FR-08.
export async function usersRoutes(app: FastifyInstance) {
  const controller = new UsersController(new UsersService(new UserRepository()))

  app.get("/", { preHandler: [authMiddleware, rbac("ADMIN")] }, controller.list)
  app.patch("/:id/approve", { preHandler: [authMiddleware, rbac("ADMIN")] }, controller.approve)
}
