import type { FastifyReply, FastifyRequest } from "fastify"
import { AuthService } from "./auth.service.js"
import type { EmailLinkService } from "./email-link.service.js"
import type { SessionService } from "./session.service.js"
import { REFRESH_TTL_MS } from "./session.service.js"
import {
  emailLinkRequestSchema,
  emailLinkVerifySchema,
  googleLoginSchema,
  updateMeSchema,
} from "./auth.validator.js"
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
    private readonly emailLinks: EmailLinkService,
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

  /** FR-07: the same answer for every well-formed address (no account enumeration). */
  requestEmailLink = async (req: FastifyRequest, reply: FastifyReply) => {
    const { email } = emailLinkRequestSchema.parse(req.body)
    const result = await this.emailLinks.request(email)
    if (result.outcome === "unavailable")
      return reply.status(503).send({
        success: false,
        message: "ยังส่งอีเมลไม่ได้ — เข้าสู่ระบบด้วย Google หรือติดต่อผู้ดูแลระบบ",
      })
    return ok(reply, { message: "ถ้าอีเมลนี้ลงทะเบียนได้ ระบบส่งลิงก์เข้าสู่ระบบไปแล้ว" })
  }

  verifyEmailLink = async (req: FastifyRequest, reply: FastifyReply) => {
    const { token } = emailLinkVerifySchema.parse(req.body)
    const result = await this.emailLinks.verify(token)
    switch (result.outcome) {
      case "invalid":
        return unauthorized(reply, "ลิงก์นี้ใช้ไปแล้วหรือหมดอายุ — ขอลิงก์ใหม่")
      case "suspended":
        // FR-03: they proved the mailbox, so naming the suspension leaks nothing.
        return forbidden(reply, "บัญชีนี้ถูกระงับการใช้งาน — ติดต่อผู้ดูแลระบบ")
      case "pending":
        if (result.registered) await this.sessions.registered(result.userId, true)
        return ok(reply, {
          status: "PENDING" as const,
          email: result.email,
          message: "บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ",
        })
      case "ok":
        if (result.registered) await this.sessions.registered(result.user.id, false)
        await this.sessions.start(result.user.id, result.refreshToken, "LOGIN")
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
    if (req.headers.origin !== env.CORS_ORIGIN)
      return forbidden(
        reply,
        "คำขอนี้มาจากเว็บไซต์ที่ไม่ได้รับอนุญาต — เปิดระบบจากที่อยู่ปกติของ CMAS",
      )

    const result = await this.sessions.refresh(readCookie(req, REFRESH_COOKIE))
    if (result.outcome === "invalid") {
      clearRefreshCookie(reply)
      return unauthorized(reply)
    }
    setRefreshCookie(reply, result.refreshToken, REFRESH_TTL_MS / 1000)
    // The account as GET /auth/me gives it, read live (NFR-19): a reload then
    // needs one round trip to start, not two (NFR-01).
    const user = await this.service.me(result.userId)
    return ok(reply, { accessToken: result.accessToken, user })
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

  updateMe = async (req: FastifyRequest, reply: FastifyReply) => {
    const { name } = updateMeSchema.parse(req.body)
    const me = await this.service.rename(callerOf(req).userId, name)
    if (!me) return notFound(reply)
    return ok(reply, me)
  }
}
