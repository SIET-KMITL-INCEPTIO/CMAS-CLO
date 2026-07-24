import type { FastifyReply } from "fastify"

type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
  errors?: unknown
}

export const ok = <T>(reply: FastifyReply, data: T) =>
  reply.status(200).send({ success: true, data } satisfies ApiResponse<T>)

export const created = <T>(reply: FastifyReply, data: T) =>
  reply.status(201).send({ success: true, data } satisfies ApiResponse<T>)

export const badRequest = (reply: FastifyReply, errors: unknown) =>
  reply.status(400).send({ success: false, errors } satisfies ApiResponse<null>)

export const unauthorized = (reply: FastifyReply, message = "Unauthorized") =>
  reply.status(401).send({ success: false, message } satisfies ApiResponse<null>)

export const forbidden = (reply: FastifyReply, message = "Forbidden") =>
  reply.status(403).send({ success: false, message } satisfies ApiResponse<null>)

export const notFound = (reply: FastifyReply, message = "Not found") =>
  reply.status(404).send({ success: false, message } satisfies ApiResponse<null>)

export const serverError = (reply: FastifyReply, message = "Internal server error") =>
  reply.status(500).send({ success: false, message } satisfies ApiResponse<null>)
