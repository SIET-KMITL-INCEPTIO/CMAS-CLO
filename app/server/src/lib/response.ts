import type { FastifyReply } from "fastify"

type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
  errors?: unknown
  /** Paging ({ total, page, perPage }) or warnings that do not block the write. */
  meta?: Record<string, unknown>
}

export const ok = <T>(reply: FastifyReply, data: T, meta?: Record<string, unknown>) =>
  reply
    .status(200)
    .send({ success: true, data, ...(meta ? { meta } : {}) } satisfies ApiResponse<T>)

export const created = <T>(reply: FastifyReply, data: T, meta?: Record<string, unknown>) =>
  reply
    .status(201)
    .send({ success: true, data, ...(meta ? { meta } : {}) } satisfies ApiResponse<T>)

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

export const conflict = (reply: FastifyReply, message: string) =>
  reply.status(409).send({ success: false, message } satisfies ApiResponse<null>)

/** `errors` carries what the caller needs to decide, e.g. the rows a confirm-less DELETE would take. */
export const unprocessable = (reply: FastifyReply, message: string, errors?: unknown) =>
  reply
    .status(422)
    .send({ success: false, message, ...(errors ? { errors } : {}) } satisfies ApiResponse<null>)

/** A file download (Excel). The name is ASCII-safe; the Thai name goes in filename*. */
export const file = (reply: FastifyReply, buffer: Buffer, fileName: string, type: string) =>
  reply
    .status(200)
    .header("Content-Type", type)
    .header(
      "Content-Disposition",
      `attachment; filename="${fileName.replace(/[^\x20-\x7e]|"/g, "_")}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    )
    .send(buffer)
