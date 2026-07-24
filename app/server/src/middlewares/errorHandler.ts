import type { FastifyError, FastifyReply, FastifyRequest } from "fastify"
import { ZodError } from "zod"
import { Prisma } from "@prisma/client"
import { badRequest, notFound, serverError } from "../lib/response.js"

export function errorHandler(
  err: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  request.log.error(err)

  if (err instanceof ZodError) {
    return badRequest(reply, err.flatten())
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return badRequest(reply, "Duplicate entry")
    if (err.code === "P2025") return notFound(reply, "Record not found")
  }

  return serverError(reply)
}
