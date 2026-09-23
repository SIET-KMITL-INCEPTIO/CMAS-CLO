import type { FastifyReply, FastifyRequest } from "fastify"
import { AuthService } from "./auth.service.js"
import { googleLoginSchema } from "./auth.validator.js"
import { ok, unauthorized } from "../../lib/response.js"

export class AuthController {
  constructor(private readonly service: AuthService) {}

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
        return ok(reply, {
          status: "ACTIVE" as const,
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        })
    }
  }
}
