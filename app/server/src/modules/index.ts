/**
 * Route registration.
 *
 * EVERY authenticated route runs authMiddleware (verifies the token AND
 * re-reads the live User row), then rbac() where a specific role is required.
 * Any route that takes a :courseId must additionally call assertCourseAccess()
 * from authorization/authorization.service.ts before reading or writing
 * anything — single-tenant means course scope is the only data boundary left,
 * so skipping it exposes a colleague's course rather than merely a
 * colleague's view.
 *
 * /health is the only legitimately unauthenticated route.
 */
import type { FastifyInstance } from "fastify"
import { healthRoutes } from "./health/health.route.js"
// import { authRoutes } from "./auth/auth.route.js"
// import { usersRoutes } from "./users/users.route.js"
// import { coursesRoutes } from "./courses/courses.route.js"
// import { closRoutes } from "./clos/clos.route.js"
// import { excelRoutes } from "./excel/excel.route.js"
// import { dashboardRoutes } from "./dashboard/dashboard.route.js"

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes)
  // await app.register(authRoutes, { prefix: "/auth" })
  // await app.register(usersRoutes, { prefix: "/users" })
  // await app.register(coursesRoutes, { prefix: "/courses" })
  // await app.register(closRoutes, { prefix: "/clos" })
  // await app.register(excelRoutes, { prefix: "/excel" })
  // await app.register(dashboardRoutes, { prefix: "/dashboard" })
}
