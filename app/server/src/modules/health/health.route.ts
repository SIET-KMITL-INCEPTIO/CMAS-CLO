import type { FastifyInstance } from "fastify"
import { ok } from "../../lib/response.js"

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (_request, reply) => {
    return ok(reply, { status: "ok", timestamp: new Date().toISOString() })
  })
}
