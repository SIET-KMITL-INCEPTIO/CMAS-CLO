import type { FastifyReply, FastifyRequest } from "fastify"
import { authorizedCourseId } from "../../middlewares/access.middleware.js"
import { created, ok, unprocessable } from "../../lib/response.js"
import type { CloService } from "./clos.service.js"
import {
  cloParamsSchema,
  confirmQuerySchema,
  createCloSchema,
  createObjectiveSchema,
  objectiveParamsSchema,
  reorderSchema,
  updateCloSchema,
  updateObjectiveSchema,
} from "./clos.validator.js"

const CONFIRM_DELETE = "ส่ง ?confirm=true เพื่อยืนยัน — มีกิจกรรมวัดอยู่ ผลการประเมินจะเปลี่ยน"

export class CloController {
  constructor(private readonly service: CloService) {}

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const { data, meta } = await this.service.list(authorizedCourseId(req))
    return ok(reply, data, meta)
  }

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = createCloSchema.parse(req.body)
    const { data, meta } = await this.service.create(authorizedCourseId(req), body)
    return created(reply, data, meta)
  }

  reorder = async (req: FastifyRequest, reply: FastifyReply) => {
    const { order } = reorderSchema.parse(req.body)
    const { data, meta } = await this.service.reorder(authorizedCourseId(req), order)
    return ok(reply, data, meta)
  }

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    const { cloId } = cloParamsSchema.parse(req.params)
    const body = updateCloSchema.parse(req.body)
    const { data, meta } = await this.service.update(cloId, authorizedCourseId(req), body)
    return ok(reply, data, meta)
  }

  remove = async (req: FastifyRequest, reply: FastifyReply) => {
    const { cloId } = cloParamsSchema.parse(req.params)
    const { confirm } = confirmQuerySchema.parse(req.query)
    const result = await this.service.remove(cloId, confirm === "true")
    if (!result.deleted) return unprocessable(reply, CONFIRM_DELETE, result.impact)
    return ok(reply, { deleted: true })
  }

  objectives = async (req: FastifyRequest, reply: FastifyReply) => {
    const { cloId } = cloParamsSchema.parse(req.params)
    const { data, meta } = await this.service.objectives(cloId)
    return ok(reply, data, meta)
  }

  createObjective = async (req: FastifyRequest, reply: FastifyReply) => {
    const { cloId } = cloParamsSchema.parse(req.params)
    const body = createObjectiveSchema.parse(req.body)
    const { data, meta } = await this.service.createObjective(cloId, body)
    return created(reply, data, meta)
  }

  updateObjective = async (req: FastifyRequest, reply: FastifyReply) => {
    const { objectiveId } = objectiveParamsSchema.parse(req.params)
    const body = updateObjectiveSchema.parse(req.body)
    const { data, meta } = await this.service.updateObjective(objectiveId, body)
    return ok(reply, data, meta)
  }

  removeObjective = async (req: FastifyRequest, reply: FastifyReply) => {
    const { objectiveId } = objectiveParamsSchema.parse(req.params)
    const { confirm } = confirmQuerySchema.parse(req.query)
    const result = await this.service.removeObjective(objectiveId, confirm === "true")
    if (!result.deleted) return unprocessable(reply, CONFIRM_DELETE, result.impact)
    return ok(reply, { deleted: true })
  }
}
