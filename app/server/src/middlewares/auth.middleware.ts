import type { FastifyReply, FastifyRequest } from "fastify"
import { verifyToken } from "../lib/jwt.js"
import { unauthorized } from "../lib/response.js"

declare module "fastify" {
  interface FastifyRequest {
    userId?: string
    userRole?: "ADMIN" | "INSTRUCTOR"
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined

  if (!token) return unauthorized(reply)

  try {
    const payload = await verifyToken(token)
    request.userId = payload.sub
    request.userRole = payload.role
  } catch {
    return unauthorized(reply, "Invalid or expired token")
  }
}
