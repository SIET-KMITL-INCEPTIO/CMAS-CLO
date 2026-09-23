import type { FastifyInstance } from "fastify"
import { AuthController } from "./auth.controller.js"
import { AuthService } from "./auth.service.js"
import { UserRepository } from "../users/user.repository.js"

// Unauthenticated on purpose — this IS the login route (FR-08).
export async function authRoutes(app: FastifyInstance) {
  const controller = new AuthController(new AuthService(new UserRepository()))

  app.post("/google", controller.loginWithGoogle)
}
