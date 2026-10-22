import type { FastifyReply, FastifyRequest } from "fastify"
import { authorizedCourseId } from "../../middlewares/access.middleware.js"
import { ok } from "../../lib/response.js"
import type { GradingService } from "./grading.service.js"
import {
  confirmQuerySchema,
  gradeBandsSchema,
  overrideSchema,
  studentParamsSchema,
} from "./grading.validator.js"

export class GradingController {
  constructor(private readonly service: GradingService) {}

  get = async (req: FastifyRequest, reply: FastifyReply) => {
    const { meta, ...data } = await this.service.get(authorizedCourseId(req))
    return ok(reply, data, meta)
  }

  saveBands = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = gradeBandsSchema.parse(req.body)
    const { meta, ...data } = await this.service.saveBands(authorizedCourseId(req), body)
    return ok(reply, data, meta)
  }

  run = async (req: FastifyRequest, reply: FastifyReply) => {
    return ok(reply, await this.service.run(authorizedCourseId(req)))
  }

  unfreeze = async (req: FastifyRequest, reply: FastifyReply) => {
    const { confirm } = confirmQuerySchema.parse(req.query)
    return ok(reply, await this.service.unfreeze(authorizedCourseId(req), confirm === "true"))
  }

  override = async (req: FastifyRequest, reply: FastifyReply) => {
    const { studentId } = studentParamsSchema.parse(req.params)
    const { grade, reason } = overrideSchema.parse(req.body)
    return ok(reply, await this.service.override(authorizedCourseId(req), studentId, grade, reason))
  }

  clearOverride = async (req: FastifyRequest, reply: FastifyReply) => {
    const { studentId } = studentParamsSchema.parse(req.params)
    return ok(reply, await this.service.clearOverride(authorizedCourseId(req), studentId))
  }
}
