import type { FastifyReply, FastifyRequest } from "fastify"
import { authorizedCourseId, callerOf } from "../../middlewares/access.middleware.js"
import { file, ok } from "../../lib/response.js"
import { XLSX_TYPE } from "../../lib/excel.js"
import type { DashboardService } from "./dashboard.service.js"
import {
  dashboardExportQuerySchema,
  scoresExportQuerySchema,
  studentParamsSchema,
} from "./dashboard.validator.js"

export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  overview = async (req: FastifyRequest, reply: FastifyReply) => {
    return ok(reply, await this.service.overview(callerOf(req)))
  }

  attainment = async (req: FastifyRequest, reply: FastifyReply) => {
    const { data, meta } = await this.service.attainment(authorizedCourseId(req))
    return ok(reply, data, meta)
  }

  atRisk = async (req: FastifyRequest, reply: FastifyReply) => {
    const { data, meta } = await this.service.atRisk(authorizedCourseId(req))
    return ok(reply, data, meta)
  }

  student = async (req: FastifyRequest, reply: FastifyReply) => {
    const { studentId } = studentParamsSchema.parse(req.params)
    return ok(reply, await this.service.student(authorizedCourseId(req), studentId))
  }

  scoresExport = async (req: FastifyRequest, reply: FastifyReply) => {
    const { type } = scoresExportQuerySchema.parse(req.query)
    const { buffer, fileName } = await this.service.scoresExport(authorizedCourseId(req), type)
    return file(reply, buffer, fileName, XLSX_TYPE)
  }

  gradesExport = async (req: FastifyRequest, reply: FastifyReply) => {
    const { buffer, fileName } = await this.service.gradesExport(authorizedCourseId(req))
    return file(reply, buffer, fileName, XLSX_TYPE)
  }

  dashboardExport = async (req: FastifyRequest, reply: FastifyReply) => {
    const { scope, studentId } = dashboardExportQuerySchema.parse(req.query)
    const { buffer, fileName } = await this.service.dashboardExport(
      authorizedCourseId(req),
      scope,
      studentId,
    )
    return file(reply, buffer, fileName, XLSX_TYPE)
  }
}
