import type { FastifyReply, FastifyRequest } from "fastify"
import { UsersService } from "./users.service.js"
import { listUsersQuerySchema, userIdParamsSchema } from "./users.validator.js"
import { notFound, ok } from "../../lib/response.js"

export class UsersController {
  constructor(private readonly service: UsersService) {}

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const { status } = listUsersQuerySchema.parse(req.query)
    return ok(reply, await this.service.list(status))
  }

  approve = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = userIdParamsSchema.parse(req.params)
    const user = await this.service.approve(id)
    if (!user) return notFound(reply, "ไม่พบผู้ใช้งานนี้")
    return ok(reply, user)
  }
}
