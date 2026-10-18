/**
 * Every thrown error becomes one response shape (S-3), and nothing a user
 * typed reaches the log (S-4).
 *
 * Why the log is so thin: a Prisma error message quotes the values that hit a
 * constraint — a student code, a name — and pino would write them to stdout
 * on every failed request (NFR-08). So only the error's name and code are
 * logged; pino adds the request id, which is enough to find the request.
 */
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify"
import { ZodError } from "zod"
import { Prisma } from "@prisma/client"
import { AppError } from "../lib/errors.js"
import { env } from "../lib/env.js"
import { CourseNotFoundError } from "../modules/authorization/authorization.service.js"
import { badRequest, conflict, notFound, serverError } from "../lib/response.js"

export function errorHandler(
  err: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // Same body for "no such course" and "not your course" (A-13).
  if (err instanceof CourseNotFoundError) return notFound(reply, err.message)

  if (err instanceof AppError) {
    return reply.status(err.statusCode).send({ success: false, message: err.message })
  }

  if (err instanceof ZodError) return badRequest(reply, err.flatten())

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return conflict(reply, "ข้อมูลนี้มีอยู่แล้ว")
    if (err.code === "P2025") return notFound(reply, "ไม่พบข้อมูลที่ระบุ")
  }

  // Fastify's own 4xx (bad JSON, body too large, rate limit 429, ...) keep
  // their status. Their messages are the framework's, not the user's input.
  const status = (err as FastifyError).statusCode
  if (typeof status === "number" && status >= 400 && status < 500) {
    return reply.status(status).send({ success: false, message: err.message })
  }

  const isPrisma = err.name.startsWith("PrismaClient")
  request.log.error(
    {
      err: {
        name: err.name,
        code: (err as { code?: unknown }).code ?? null,
        // A bug in our own code needs its stack to be found. Only on a
        // developer's machine, and never for Prisma, whose message carries row values.
        stack: env.NODE_ENV === "development" && !isPrisma ? err.stack : undefined,
      },
    },
    "unhandled error",
  )
  return serverError(reply)
}
