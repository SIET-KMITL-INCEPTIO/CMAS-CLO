/**
 * Publishes "course X changed" after a write to a course succeeds (see
 * modules/events/events.service.ts). Runs on onResponse, after the writer
 * already has their answer, so it adds nothing to the write's own latency.
 */
import type { FastifyReply, FastifyRequest } from "fastify"
import { events } from "../modules/events/events.service.js"

declare module "fastify" {
  interface FastifyRequest {
    /** A new course's id, read from the response of a route that creates one. */
    createdCourseId?: string
  }
}

const WRITES = new Set(["POST", "PUT", "PATCH", "DELETE"])
/** POST /courses and POST /courses/:courseId/duplicate create a course, known only from the response body. */
const CREATES_A_COURSE = /\/courses(?:\/:courseId\/duplicate)?$/
const CLIENT_ID = /^[\w-]{1,64}$/

const succeededWrite = (request: FastifyRequest, reply: FastifyReply) =>
  WRITES.has(request.method) && reply.statusCode < 300

/** onSend: capture the new course's id; the payload is not changed. */
export async function captureCreatedCourse(
  request: FastifyRequest,
  reply: FastifyReply,
  payload: unknown,
) {
  if (
    succeededWrite(request, reply) &&
    request.method === "POST" &&
    CREATES_A_COURSE.test(request.routeOptions.url ?? "") &&
    typeof payload === "string"
  ) {
    try {
      const id = (JSON.parse(payload) as { data?: { id?: unknown } }).data?.id
      if (typeof id === "string") request.createdCourseId = id
    } catch {
      // Not JSON: nothing to announce.
    }
  }
  return payload
}

/** onResponse: tell every other tab that may see the course. */
export async function publishCourseChange(request: FastifyRequest, reply: FastifyReply) {
  if (!succeededWrite(request, reply) || !request.userId) return
  const courseId = request.courseId ?? request.createdCourseId
  if (!courseId) return
  const header = request.headers["x-client-id"]
  const origin = typeof header === "string" && CLIENT_ID.test(header) ? header : undefined
  await events
    .courseChanged({ courseId, ...(origin ? { origin } : {}) }, request.userId)
    .catch((e: Error) =>
      request.log.error({ err: { name: e.name } }, "could not publish course change"),
    )
}
