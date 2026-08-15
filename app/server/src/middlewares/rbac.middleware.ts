import type { FastifyReply, FastifyRequest } from "fastify"
import { forbidden } from "../lib/response.js"

/**
 * Role check.
 *
 * Reads `request.userRole`, which authMiddleware took from the live User row
 * rather than from the token claim — so a demotion is honoured on the next
 * request.
 *
 * This answers "what role", never "whose data". Course assignment (FR-25 /
 * NFR-07) is authorization.service.ts's question; the two are separate and
 * both must be asked on every course-scoped route.
 */
export function rbac(requiredRole: "ADMIN" | "INSTRUCTOR") {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const role = request.userRole
    if (role !== requiredRole && role !== "ADMIN") {
      return forbidden(reply)
    }
  }
}
