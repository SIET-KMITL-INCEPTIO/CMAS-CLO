import type { FastifyReply, FastifyRequest } from "fastify"
import { authorizedCourseId, callerOf } from "../../middlewares/access.middleware.js"
import { created, file, ok, unprocessable } from "../../lib/response.js"
import { XLSX_TYPE } from "../../lib/excel.js"
import { readUpload } from "../../lib/upload.js"
import type { StudentService } from "./students.service.js"
import {
  commitSchema,
  confirmQuerySchema,
  createStudentSchema,
  listStudentsQuerySchema,
  remediationParamsSchema,
  remediationSchema,
  studentParamsSchema,
  updateStudentSchema,
} from "./students.validator.js"

export class StudentController {
  constructor(private readonly service: StudentService) {}

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const query = listStudentsQuerySchema.parse(req.query)
    const { data, meta } = await this.service.list(authorizedCourseId(req), query)
    return ok(reply, data, meta)
  }

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = createStudentSchema.parse(req.body)
    return created(reply, await this.service.create(authorizedCourseId(req), body))
  }

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    const { studentId } = studentParamsSchema.parse(req.params)
    const body = updateStudentSchema.parse(req.body)
    return ok(reply, await this.service.update(studentId, body))
  }

  remove = async (req: FastifyRequest, reply: FastifyReply) => {
    const { studentId } = studentParamsSchema.parse(req.params)
    const { confirm } = confirmQuerySchema.parse(req.query)
    const result = await this.service.remove(studentId, confirm === "true")
    if (!result.deleted) {
      return unprocessable(
        reply,
        "ส่ง ?confirm=true เพื่อยืนยัน — คะแนนและเกรดของนักศึกษาคนนี้จะหายด้วย",
        result.impact,
      )
    }
    return ok(reply, { deleted: true })
  }

  withdraw = async (req: FastifyRequest, reply: FastifyReply) => {
    const { studentId } = studentParamsSchema.parse(req.params)
    return ok(reply, await this.service.withdraw(studentId))
  }

  restore = async (req: FastifyRequest, reply: FastifyReply) => {
    const { studentId } = studentParamsSchema.parse(req.params)
    return ok(reply, await this.service.restore(studentId))
  }

  savePlan = async (req: FastifyRequest, reply: FastifyReply) => {
    const { studentId, cloId } = remediationParamsSchema.parse(req.params)
    const { plan } = remediationSchema.parse(req.body)
    const result = await this.service.savePlan(
      studentId,
      cloId,
      authorizedCourseId(req),
      plan,
      callerOf(req).userId, // A-8: updatedBy from the token, never the body
    )
    return ok(reply, result)
  }

  deletePlan = async (req: FastifyRequest, reply: FastifyReply) => {
    const { studentId, cloId } = remediationParamsSchema.parse(req.params)
    return ok(reply, await this.service.deletePlan(studentId, cloId, authorizedCourseId(req)))
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
}
