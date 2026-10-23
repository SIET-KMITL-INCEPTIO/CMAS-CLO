import type { FastifyInstance } from "fastify"
import { AuthController } from "./auth.controller.js"
import { AuthService } from "./auth.service.js"
import { RefreshTokenRepository } from "./refresh-token.repository.js"
import { SessionService } from "./session.service.js"
import { AuthEventRepository } from "../users/auth-event.repository.js"
import { UserRepository } from "../users/user.repository.js"

// S-5: brute force and token-guessing get a tighter limit than the API as a whole.
const LOGIN_LIMIT = { max: 5, timeWindow: "15 minutes" }
// A refresh happens every 15 minutes per open tab; 5 would lock out a busy browser.
const REFRESH_LIMIT = { max: 30, timeWindow: "15 minutes" }

// /google and /refresh are unauthenticated on purpose — they ARE how a session starts (FR-08, S-2).
export async function authRoutes(app: FastifyInstance) {
  const users = new UserRepository()
  const controller = new AuthController(
    new AuthService(users),
    new SessionService(new RefreshTokenRepository(), users, new AuthEventRepository()),
  )

  app.post(
    "/google",
    { config: { access: "public", rateLimit: LOGIN_LIMIT } },
    controller.loginWithGoogle,
  )
  app.post(
    "/refresh",
    { config: { access: "public", rateLimit: REFRESH_LIMIT } },
    controller.refresh,
  )
  app.post("/logout", { config: { access: "authenticated" } }, controller.logout)
  app.get("/me", { config: { access: "authenticated" } }, controller.me)
}
