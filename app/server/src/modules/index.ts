/**
 * Route registration. app.ts mounts everything here under /api/v1 (G-1).
 *
 * Every route declares `config.access` — "public", "authenticated" or
 * { cap } from authorization/capabilities.ts — and app.ts refuses to start if
 * one does not (A-6). The access hook then runs authMiddleware (verifies the
 * token AND re-reads the live User row) and authorize(). A course capability
 * reads :courseId from the path and answers 404, never 403, for a course the
 * caller cannot see — single-tenant means course scope is the only data
 * boundary left.
 *
 * /health and /auth/* (the login routes themselves) are the only
 * legitimately public routes.
 */
import type { FastifyInstance } from "fastify"
import { healthRoutes } from "./health/health.route.js"
import { authRoutes } from "./auth/auth.route.js"
import { usersRoutes } from "./users/users.route.js"
import { coursesRoutes } from "./courses/courses.route.js"
import { closRoutes } from "./clos/clos.route.js"
import { activitiesRoutes } from "./activities/activities.route.js"
import { studentsRoutes } from "./students/students.route.js"
import { scoresRoutes } from "./scores/scores.route.js"
// import { dashboardRoutes } from "./dashboard/dashboard.route.js"

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes)
  await app.register(authRoutes, { prefix: "/auth" })
  await app.register(usersRoutes, { prefix: "/users" })
  await app.register(coursesRoutes, { prefix: "/courses" })
  await app.register(closRoutes)
  await app.register(activitiesRoutes)
  await app.register(studentsRoutes)
  await app.register(scoresRoutes)
  // await app.register(dashboardRoutes, { prefix: "/dashboard" })
}
