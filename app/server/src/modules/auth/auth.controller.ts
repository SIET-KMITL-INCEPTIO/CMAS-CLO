import type { FastifyReply, FastifyRequest } from "fastify"
import { AuthService } from "./auth.service.js"
import type { SessionService } from "./session.service.js"
import { REFRESH_TTL_MS } from "./session.service.js"
import { googleLoginSchema } from "./auth.validator.js"
import { env } from "../../lib/env.js"
import {
  clearRefreshCookie,
  readCookie,
  REFRESH_COOKIE,
  setRefreshCookie,
} from "../../lib/cookie.js"
import { forbidden, notFound, ok, unauthorized } from "../../lib/response.js"
import { callerOf } from "../../middlewares/access.middleware.js"

export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly sessions: SessionService,
  ) {}

  loginWithGoogle = async (req: FastifyRequest, reply: FastifyReply) => {
    const { idToken } = googleLoginSchema.parse(req.body)
    const result = await this.service.loginWithGoogle(idToken)

    switch (result.outcome) {
      case "invalid":
      case "denied":
        return unauthorized(reply)
      case "pending":
        return ok(reply, {
          status: "PENDING" as const,
          message: "บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ",
        })
      case "ok":
        // S-2: the refresh token goes to an httpOnly cookie, never into the body script can read.
        await this.sessions.start(result.user.id, result.refreshToken)
        setRefreshCookie(reply, result.refreshToken, REFRESH_TTL_MS / 1000)
        return ok(reply, {
          status: "ACTIVE" as const,
          user: result.user,
          accessToken: result.accessToken,
        })
    }
  }

  refresh = async (req: FastifyRequest, reply: FastifyReply) => {
    // S-11: the cookie is sent automatically, so only our own front end may trigger a refresh.
    if (req.headers.origin !== env.CORS_ORIGIN) return forbidden(reply, "Origin not allowed")

    const result = await this.sessions.refresh(readCookie(req, REFRESH_COOKIE))
    if (result.outcome === "invalid") {
      clearRefreshCookie(reply)
      return unauthorized(reply)
    }
    setRefreshCookie(reply, result.refreshToken, REFRESH_TTL_MS / 1000)
    return ok(reply, { accessToken: result.accessToken })
  }

  logout = async (req: FastifyRequest, reply: FastifyReply) => {
    await this.sessions.end(callerOf(req).userId, readCookie(req, REFRESH_COOKIE))
    clearRefreshCookie(reply)
    return ok(reply, { loggedOut: true })
  }

  me = async (req: FastifyRequest, reply: FastifyReply) => {
    const me = await this.service.me(callerOf(req).userId)
    if (!me) return notFound(reply)
    return ok(reply, me)
  }
}
