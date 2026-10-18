/**
 * One gate for every route (A-6, A-7).
 *
 * Each route declares who may call it in `config.access`:
 *
 *   "public"          no token (health, the login route itself)
 *   "authenticated"   any signed-in, active account (e.g. "my profile")
 *   { cap }           a capability from authorization/capabilities.ts
 *
 * app.ts refuses to start if a route declares nothing, so "forgot the
 * permission check" is a boot error instead of an open endpoint. The check
 * runs as a preHandler, in the order A-7 fixes: rate limit (onRequest) →
 * authMiddleware → courseId shape → authorize() → the handler parses its body.
 */
import type { FastifyReply, FastifyRequest, RouteOptions } from "fastify"
import { z } from "zod"
import { authMiddleware } from "./auth.middleware.js"
import { authorize, CourseNotFoundError } from "../modules/authorization/authorization.service.js"
import {
  CAPABILITIES,
  isCapability,
  type Capability,
} from "../modules/authorization/capabilities.js"

export type RouteAccess = "public" | "authenticated" | { cap: Capability }

declare module "fastify" {
  interface FastifyContextConfig {
    access?: RouteAccess
  }
}

const COURSE_PARAM = ":courseId"

/** @fastify/cors answers preflight on its own route. It carries no credentials and returns no data. */
const isCorsPreflight = (method: unknown, url: string | undefined) =>
  method === "OPTIONS" && url === "*"
const courseIdSchema = z.cuid()

/** onRoute hook: reject a route at registration if its access is missing or impossible. */
export function assertRouteDeclaresAccess(route: RouteOptions): void {
  const where = `${String(route.method)} ${route.url}`
  const access = (route.config as { access?: RouteAccess } | undefined)?.access

  if (isCorsPreflight(route.method, route.url)) return
  if (access === undefined) {
    throw new Error(`${where} has no config.access — declare "public", "authenticated" or { cap }`)
  }
  if (access === "public" || access === "authenticated") return
  if (!isCapability(access.cap))
    throw new Error(`${where} declares unknown capability "${access.cap}"`)

  // Leaf routes (/clos/:cloId, ...) will need a resolver from leaf id to
  // course. Until one exists, a course capability needs :courseId in the path.
  if (CAPABILITIES[access.cap].scope === "course" && !route.url.includes(COURSE_PARAM)) {
    throw new Error(
      `${where} declares course capability "${access.cap}" but has no ${COURSE_PARAM}`,
    )
  }
}

export async function accessHook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const access = request.routeOptions.config.access

  // Only Fastify's own not-found handler gets here without a declaration:
  // every registered route was checked by assertRouteDeclaresAccess.
  if (access === undefined) {
    if (request.is404 || isCorsPreflight(request.method, request.routeOptions.url)) return
    throw new Error(`Route ${request.routeOptions.url ?? request.url} has no access declaration`)
  }
  if (access === "public") return

  await authMiddleware(request, reply)
  if (reply.sent) return
  if (access === "authenticated") return

  let courseId: string | null = null
  if (CAPABILITIES[access.cap].scope === "course") {
    const raw = (request.params as Record<string, unknown>).courseId
    // A malformed id gets the same 404 as a missing one (A-13).
    const parsed = courseIdSchema.safeParse(raw)
    if (!parsed.success) throw new CourseNotFoundError()
    courseId = parsed.data
  }

  // authMiddleware set both from the live User row, never from the token.
  await authorize(access.cap, courseId, { userId: request.userId!, role: request.userRole! })
}
