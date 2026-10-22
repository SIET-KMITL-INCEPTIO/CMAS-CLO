import type { FastifyReply, FastifyRequest } from "fastify"
import { authorizedCourseId, callerOf } from "../../middlewares/access.middleware.js"
import { created, ok, unprocessable } from "../../lib/response.js"
import type { ActivityService } from "./activities.service.js"
import {
  activityParamsSchema,
  closeSchema,
  confirmQuerySchema,
  createActivitySchema,
  criteriaSchema,
  groupWeightsSchema,
  reorderSchema,
  updateActivitySchema,
} from "./activities.validator.js"

export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const { data, meta } = await this.service.list(authorizedCourseId(req))
    return ok(reply, data, meta)
  }

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = createActivitySchema.parse(req.body)
    const { data, meta } = await this.service.create(authorizedCourseId(req), body)
    return created(reply, data, meta)
  }

  reorder = async (req: FastifyRequest, reply: FastifyReply) => {
    const { order } = reorderSchema.parse(req.body)
    const { data, meta } = await this.service.reorder(authorizedCourseId(req), order)
    return ok(reply, data, meta)
  }

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    const { activityId } = activityParamsSchema.parse(req.params)
    const body = updateActivitySchema.parse(req.body)
    const { data, meta } = await this.service.update(activityId, authorizedCourseId(req), body)
    return ok(reply, data, meta)
  }

  remove = async (req: FastifyRequest, reply: FastifyReply) => {
    const { activityId } = activityParamsSchema.parse(req.params)
    const { confirm } = confirmQuerySchema.parse(req.query)
    const result = await this.service.remove(
      activityId,
      authorizedCourseId(req),
      confirm === "true",
    )
    if (!result.deleted) {
      return unprocessable(
        reply,
        "ส่ง ?confirm=true เพื่อยืนยัน — คะแนนของกิจกรรมนี้จะหายด้วย",
        result.impact,
      )
    }
    return ok(reply, { deleted: true })
  }

  duplicate = async (req: FastifyRequest, reply: FastifyReply) => {
    const { activityId } = activityParamsSchema.parse(req.params)
    const { data, meta } = await this.service.duplicate(activityId, authorizedCourseId(req))
    return created(reply, data, meta)
  }

  criteria = async (req: FastifyRequest, reply: FastifyReply) => {
    const { data, meta } = await this.service.criteria(authorizedCourseId(req))
    return ok(reply, data, meta)
  }

  replaceCriteria = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = criteriaSchema.parse(req.body)
    const { data, meta } = await this.service.replaceCriteria(authorizedCourseId(req), body)
    return ok(reply, data, meta)
  }

  groupWeights = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = groupWeightsSchema.parse(req.body)
    return ok(reply, await this.service.setGroupWeights(authorizedCourseId(req), body))
  }

  close = async (req: FastifyRequest, reply: FastifyReply) => {
    const { activityId } = activityParamsSchema.parse(req.params)
    const { blank, reason } = closeSchema.parse(req.body ?? {})
    const result = await this.service.close(
      activityId,
      authorizedCourseId(req),
      blank,
      reason,
      callerOf(req).userId,
    )
    return ok(reply, result)
  }

  reopen = async (req: FastifyRequest, reply: FastifyReply) => {
    const { activityId } = activityParamsSchema.parse(req.params)
    return ok(reply, await this.service.reopen(activityId))
  }
}
