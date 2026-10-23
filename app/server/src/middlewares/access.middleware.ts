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
import { ForbiddenError } from "../lib/errors.js"
import { AuthEventRepository } from "../modules/users/auth-event.repository.js"
import { authMiddleware } from "./auth.middleware.js"
import {
  authorize,
  CourseNotFoundError,
  LEAF_PARAMS,
  resolveCourseId,
} from "../modules/authorization/authorization.service.js"
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
  interface FastifyRequest {
    /** The course a course-capability route was authorized against: from :courseId or resolved from a leaf id (A-3). */
    courseId?: string
  }
}

const authEvents = new AuthEventRepository()
const COURSE_PARAM = ":courseId"
const hasParam = (url: string, name: string) => new RegExp(`:${name}(?:/|$)`).test(url)
/** A course capability needs a path param the course can be found from. */
const scopesACourse = (url: string) =>
  url.includes(COURSE_PARAM) || LEAF_PARAMS.some((p) => hasParam(url, p))

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

  // A leaf route (/clos/:cloId, ...) finds its course through resolveCourseId (A-3).
  if (CAPABILITIES[access.cap].scope === "course" && !scopesACourse(route.url)) {
    throw new Error(
      `${where} declares course capability "${access.cap}" but has no ${COURSE_PARAM} or leaf id`,
    )
  }
}

/** The course this request is about, or CourseNotFoundError. Malformed, missing and foreign ids all end here alike (A-13). */
async function courseOf(params: Record<string, unknown>): Promise<string> {
  if ("courseId" in params) {
    const parsed = courseIdSchema.safeParse(params.courseId)
    if (!parsed.success) throw new CourseNotFoundError()
    return parsed.data
  }
  for (const param of LEAF_PARAMS) {
    if (!(param in params)) continue
    const parsed = courseIdSchema.safeParse(params[param])
    if (!parsed.success) throw new CourseNotFoundError()
    const courseId = await resolveCourseId(param, parsed.data)
    if (!courseId) throw new CourseNotFoundError()
    return courseId
  }
  throw new CourseNotFoundError()
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

  const courseId =
    CAPABILITIES[access.cap].scope === "course"
      ? await courseOf(request.params as Record<string, unknown>)
      : null

  // authMiddleware set both from the live User row, never from the token.
  try {
    await authorize(access.cap, courseId, { userId: request.userId!, role: request.userRole! })
  } catch (err) {
    // S-10 / FR-22b: a refusal leaves a trace, so the permission matrix can be audited.
    // Only the 403 is recorded; a 404 is "no such course" as far as anyone may know.
    if (err instanceof ForbiddenError) {
      const detail = `${access.cap}${courseId ? ` course=${courseId}` : ""}`
      await authEvents
        .record(request.userId!, request.userId!, "DENY", detail)
        .catch((e: Error) => request.log.error({ err: { name: e.name } }, "could not record DENY"))
    }
    throw err
  }
  if (courseId) request.courseId = courseId
}

/** Who is calling, as authMiddleware read it from the live User row. Only valid on a non-public route. */
export const callerOf = (request: FastifyRequest) => ({
  userId: request.userId!,
  role: request.userRole!,
})

/** The course the access hook authorized this request against (course capabilities only). */
export const authorizedCourseId = (request: FastifyRequest) => request.courseId!
