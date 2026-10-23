import type { FastifyReply, FastifyRequest } from "fastify"
import { authorizedCourseId, callerOf } from "../../middlewares/access.middleware.js"
import { created, ok, unprocessable } from "../../lib/response.js"
import type { CourseService } from "./courses.service.js"
import {
  addInstructorSchema,
  confirmQuerySchema,
  courseParamsSchema,
  createCourseSchema,
  instructorParamsSchema,
  listCoursesQuerySchema,
  updateCourseSchema,
} from "./courses.validator.js"

export class CourseController {
  constructor(private readonly service: CourseService) {}

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const query = listCoursesQuerySchema.parse(req.query)
    const { data, meta } = await this.service.list(query, callerOf(req))
    return ok(reply, data, meta)
  }

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = createCourseSchema.parse(req.body)
    return created(reply, await this.service.create(body, callerOf(req)))
  }

  get = async (req: FastifyRequest, reply: FastifyReply) => {
    return ok(reply, await this.service.get(authorizedCourseId(req)))
  }

  update = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = updateCourseSchema.parse(req.body)
    return ok(reply, await this.service.update(authorizedCourseId(req), body))
  }

  remove = async (req: FastifyRequest, reply: FastifyReply) => {
    const { confirm } = confirmQuerySchema.parse(req.query)
    const result = await this.service.remove(authorizedCourseId(req), confirm === "true")
    if (!result.deleted) {
      return unprocessable(
        reply,
        "ส่ง ?confirm=true เพื่อยืนยันการลบ ข้อมูลต่อไปนี้จะหายทั้งหมด",
        result.impact,
      )
    }
    return ok(reply, { deleted: true })
  }

  impact = async (req: FastifyRequest, reply: FastifyReply) => {
    return ok(reply, await this.service.impact(authorizedCourseId(req)))
  }

  instructors = async (req: FastifyRequest, reply: FastifyReply) => {
    return ok(reply, await this.service.instructors(authorizedCourseId(req)))
  }

  addInstructor = async (req: FastifyRequest, reply: FastifyReply) => {
    const { userId } = addInstructorSchema.parse(req.body)
    return created(reply, await this.service.addInstructor(authorizedCourseId(req), userId))
  }

  removeInstructor = async (req: FastifyRequest, reply: FastifyReply) => {
    const { userId } = instructorParamsSchema.parse(req.params)
    return ok(
      reply,
      await this.service.removeInstructor(authorizedCourseId(req), userId, callerOf(req)),
    )
  }

  duplicate = async (req: FastifyRequest, reply: FastifyReply) => {
    const { courseId } = courseParamsSchema.parse(req.params)
    return created(reply, await this.service.duplicate(courseId, callerOf(req)))
  }
}
