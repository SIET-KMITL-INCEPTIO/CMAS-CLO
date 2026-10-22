import type { FastifyReply, FastifyRequest } from "fastify"
import { UsersService } from "./users.service.js"
import {
  authEventsQuerySchema,
  instructorSearchSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamsSchema,
  userParamsSchema,
  userStatusSchema,
} from "./users.validator.js"
import { notFound, ok } from "../../lib/response.js"
import { callerOf } from "../../middlewares/access.middleware.js"

export class UsersController {
  constructor(private readonly service: UsersService) {}

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const { status } = listUsersQuerySchema.parse(req.query)
    return ok(reply, await this.service.list(status))
  }

  approve = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = userIdParamsSchema.parse(req.params)
    const user = await this.service.approve(id, callerOf(req).userId)
    if (!user) return notFound(reply, "ไม่พบผู้ใช้งานนี้")
    return ok(reply, user)
  }

  instructors = async (req: FastifyRequest, reply: FastifyReply) => {
    const { q, limit } = instructorSearchSchema.parse(req.query)
    return ok(reply, await this.service.searchInstructors(q, limit))
  }

  get = async (req: FastifyRequest, reply: FastifyReply) => {
    const { userId } = userParamsSchema.parse(req.params)
    return ok(reply, await this.service.get(userId))
  }

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    const { userId } = userParamsSchema.parse(req.params)
    const body = updateUserSchema.parse(req.body)
    return ok(reply, await this.service.update(userId, body, callerOf(req).userId))
  }

  setStatus = async (req: FastifyRequest, reply: FastifyReply) => {
    const { userId } = userParamsSchema.parse(req.params)
    const { isActive } = userStatusSchema.parse(req.body)
    return ok(reply, await this.service.setActive(userId, isActive, callerOf(req).userId))
  }

  authEvents = async (req: FastifyRequest, reply: FastifyReply) => {
    const { userId } = userParamsSchema.parse(req.params)
    const query = authEventsQuerySchema.parse(req.query)
    const { data, meta } = await this.service.authEvents(userId, query)
    return ok(reply, data, meta)
  }
}
