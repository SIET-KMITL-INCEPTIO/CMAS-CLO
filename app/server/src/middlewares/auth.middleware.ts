/**
 * Authentication — verify the token, then RE-READ the live User row.
 *
 * The second half used to be tenantMiddleware's job (it resolved a Membership
 * to get the role). Single-tenant killed the Membership table but not the
 * reason for the round trip: the JWT's role claim is a 15-minute-old snapshot,
 * so trusting it means a demoted or deactivated account keeps its access for
 * up to 15 minutes. One indexed lookup at 10-50 concurrent instructors
 * (SRS §2.2) is invisible — do not cache it until a profile says otherwise.
 */
import type { FastifyReply, FastifyRequest } from "fastify"
import { verifyToken } from "../lib/jwt.js"
import { prisma } from "../db/prisma.js"
import { unauthorized } from "../lib/response.js"

declare module "fastify" {
  interface FastifyRequest {
    userId?: string
    /** Read from the live User row by authMiddleware, never from the token. */
    userRole?: "ADMIN" | "INSTRUCTOR"
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined

  if (!token) return unauthorized(reply)

  let userId: string
  try {
    const payload = await verifyToken(token)
    userId = payload.sub
  } catch {
    return unauthorized(reply, "Invalid or expired token")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  })

  // Same reply for "no such user" and "deactivated" — distinguishing them
  // tells a caller which user ids are real (FR-03).
  if (!user || !user.isActive) return unauthorized(reply)

  request.userId = userId
  request.userRole = user.role
}
