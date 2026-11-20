import type { FastifyReply, FastifyRequest } from "fastify"
import { created, ok } from "../../lib/response.js"
import { authorizedCourseId, callerOf } from "../../middlewares/access.middleware.js"
import { ADDIN_RELEASE } from "./addin-release.js"
import type { ExcelService } from "./excel.service.js"
import { approveSchema, collectTokenSchema, linkParamsSchema } from "./excel.validator.js"

export class ExcelController {
  constructor(private readonly service: ExcelService) {}

  /** POST /excel/device — the add-in starts a sign-in. */
  start = async (_req: FastifyRequest, reply: FastifyReply) =>
    created(reply, await this.service.start())

  /** POST /excel/token — the add-in polls until the instructor approves. */
  collect = async (req: FastifyRequest, reply: FastifyReply) => {
    const { deviceCode } = collectTokenSchema.parse(req.body)
    const result = await this.service.collect(deviceCode)
    // The token is a credential: no proxy or browser may keep a copy.
    reply.header("Cache-Control", "no-store")
    // "ok" created the ExcelLink; pending and expired wrote nothing.
    return result.status === "ok" ? created(reply, result) : ok(reply, result)
  }

  /** POST /courses/:courseId/excel-links — the signed-in instructor approves a code for this course. */
  approve = async (req: FastifyRequest, reply: FastifyReply) => {
    const { userCode } = approveSchema.parse(req.body)
    await this.service.approve(callerOf(req).userId, userCode, authorizedCourseId(req))
    return created(reply, { approved: true })
  }

  /** GET /courses/:courseId/revision — the add-in polls this every 10 s (FR-76). */
  revision = async (req: FastifyRequest, reply: FastifyReply) => {
    reply.header("Cache-Control", "no-store")
    return ok(reply, await this.service.revision(authorizedCourseId(req)))
  }

  /** GET /excel/links — the caller's own live add-in connections. */
  list = async (req: FastifyRequest, reply: FastifyReply) =>
    ok(reply, await this.service.listLinks(callerOf(req).userId))

  /** DELETE /excel/links/:linkId — end one connection now. */
  revoke = async (req: FastifyRequest, reply: FastifyReply) => {
    const { linkId } = linkParamsSchema.parse(req.params)
    await this.service.revoke(callerOf(req).userId, linkId)
    return ok(reply, { revoked: true })
  }

  /** GET /excel/addin — the current release, for the add-in's "new version" notice. */
  release = async (_req: FastifyRequest, reply: FastifyReply) => ok(reply, ADDIN_RELEASE)
}
