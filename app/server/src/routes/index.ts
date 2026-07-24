import type { FastifyInstance } from "fastify"
import { healthRoutes } from "./health.route.js"
// import { authRoutes } from "./auth.route.js"
// import { usersRoutes } from "./users.route.js"
// import { coursesRoutes } from "./courses.route.js"
// import { closRoutes } from "./clos.route.js"
// import { excelRoutes } from "./excel.route.js"
// import { dashboardRoutes } from "./dashboard.route.js"

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes)
  // await app.register(authRoutes, { prefix: "/auth" })
  // await app.register(usersRoutes, { prefix: "/users" })
  // await app.register(coursesRoutes, { prefix: "/courses" })
  // await app.register(closRoutes, { prefix: "/clos" })
  // await app.register(excelRoutes, { prefix: "/excel" })
  // await app.register(dashboardRoutes, { prefix: "/dashboard" })
}
