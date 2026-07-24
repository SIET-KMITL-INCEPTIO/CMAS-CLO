import type { FastifyReply, FastifyRequest } from "fastify"
import { forbidden } from "../lib/response.js"

export function rbac(requiredRole: "ADMIN" | "INSTRUCTOR") {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.userRole !== requiredRole && request.userRole !== "ADMIN") {
      return forbidden(reply)
    }
  }
}
