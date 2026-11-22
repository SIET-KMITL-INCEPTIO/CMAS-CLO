import type { FastifyInstance } from "fastify"
import { AuthController } from "./auth.controller.js"
import { AuthService } from "./auth.service.js"
import { EmailLinkRepository } from "./email-link.repository.js"
import { EmailLinkService } from "./email-link.service.js"
import { env } from "../../lib/env.js"
import { createMailer } from "../../lib/mailer.js"
import { RefreshTokenRepository } from "./refresh-token.repository.js"
import { SessionService } from "./session.service.js"
import { AuthEventRepository } from "../users/auth-event.repository.js"
import { UserRepository } from "../users/user.repository.js"

// S-5: brute force and token-guessing get a tighter limit than the API as a whole.
const LOGIN_LIMIT = { max: 5, timeWindow: "15 minutes" }
// A refresh happens every 15 minutes per open tab; 5 would lock out a busy browser.
const REFRESH_LIMIT = { max: env.AUTH_REFRESH_LIMIT_MAX, timeWindow: "15 minutes" }

// /google, /email-link* and /refresh are unauthenticated on purpose — they ARE how a session starts (FR-07, FR-08, S-2).
export async function authRoutes(app: FastifyInstance) {
  const users = new UserRepository()
  const controller = new AuthController(
    new AuthService(users),
    new SessionService(new RefreshTokenRepository(), users, new AuthEventRepository()),
    new EmailLinkService(
      users,
      new EmailLinkRepository(),
      createMailer(),
      undefined,
      undefined,
      // Never the address or the link: the message only (see EmailLinkService).
      (err) => app.log.error("sign-in link email failed: %s", (err as Error).message),
    ),
  )

  app.post(
    "/google",
    { config: { access: "public", rateLimit: LOGIN_LIMIT } },
    controller.loginWithGoogle,
  )
  // FR-04: the same per-IP limit as /google, on asking and on opening.
  app.post(
    "/email-link",
    { config: { access: "public", rateLimit: LOGIN_LIMIT } },
    controller.requestEmailLink,
  )
  app.post(
    "/email-link/verify",
    { config: { access: "public", rateLimit: LOGIN_LIMIT } },
    controller.verifyEmailLink,
  )
  app.post(
    "/refresh",
    { config: { access: "public", rateLimit: REFRESH_LIMIT } },
    controller.refresh,
  )
  app.post("/logout", { config: { access: "authenticated" } }, controller.logout)
  app.get("/me", { config: { access: "authenticated" } }, controller.me)
  app.patch("/me", { config: { access: "authenticated" } }, controller.updateMe)
}
