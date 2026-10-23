import type { FastifyReply, FastifyRequest } from "fastify"
import { authorizedCourseId, callerOf } from "../../middlewares/access.middleware.js"
import { file, ok } from "../../lib/response.js"
import { XLSX_TYPE } from "../../lib/excel.js"
import { readUpload } from "../../lib/upload.js"
import type { ScoreService } from "./scores.service.js"
import {
  commitSchema,
  putScoresSchema,
  scoreChangesQuerySchema,
  scoresQuerySchema,
  uploadErrorsQuerySchema,
  uploadParamsSchema,
  uploadsQuerySchema,
} from "./scores.validator.js"

export class ScoreController {
  constructor(private readonly service: ScoreService) {}

  grid = async (req: FastifyRequest, reply: FastifyReply) => {
    const query = scoresQuerySchema.parse(req.query)
    const { data, meta } = await this.service.grid(authorizedCourseId(req), query)
    return ok(reply, data, meta)
  }

  // NFR-08: the body holds student data — it is parsed, never logged.
  put = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = putScoresSchema.parse(req.body)
    return ok(reply, await this.service.put(authorizedCourseId(req), body, callerOf(req).userId))
  }

  template = async (req: FastifyRequest, reply: FastifyReply) => {
    const { buffer, fileName } = await this.service.template(authorizedCourseId(req))
    return file(reply, buffer, fileName, XLSX_TYPE)
  }

  previewImport = async (req: FastifyRequest, reply: FastifyReply) => {
    const upload = await readUpload(req)
    const result = await this.service.previewImport(
      authorizedCourseId(req),
      callerOf(req).userId,
      upload.buffer,
      upload.fileName,
    )
    return ok(reply, result)
  }

  commitImport = async (req: FastifyRequest, reply: FastifyReply) => {
    const { previewToken } = commitSchema.parse(req.body)
    return ok(
      reply,
      await this.service.commitImport(authorizedCourseId(req), callerOf(req).userId, previewToken),
    )
  }

  uploads = async (req: FastifyRequest, reply: FastifyReply) => {
    const query = uploadsQuerySchema.parse(req.query)
    const { data, meta } = await this.service.uploads(authorizedCourseId(req), query)
    return ok(reply, data, meta)
  }

  uploadErrors = async (req: FastifyRequest, reply: FastifyReply) => {
    const { uploadId } = uploadParamsSchema.parse(req.params)
    const { format } = uploadErrorsQuerySchema.parse(req.query)
    const rejects = await this.service.uploadErrors(uploadId)
    if (format === "xlsx") {
      const { buffer, fileName } = this.service.uploadErrorsWorkbook(rejects, uploadId)
      return file(reply, buffer, fileName, XLSX_TYPE)
    }
    return ok(reply, rejects)
  }

  changes = async (req: FastifyRequest, reply: FastifyReply) => {
    const query = scoreChangesQuerySchema.parse(req.query)
    const { data, meta } = await this.service.changes(authorizedCourseId(req), query)
    return ok(reply, data, meta)
  }
}
