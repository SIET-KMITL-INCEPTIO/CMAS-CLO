/**
 * Builds the Fastify app without listening, so tests can `inject()` requests
 * into exactly what production runs. index.ts only adds `listen()`.
 */
import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
  type RouteOptions,
} from "fastify"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import multipart from "@fastify/multipart"
import { env } from "./lib/env.js"
import { errorHandler } from "./middlewares/error-handler.middleware.js"
import { accessHook, assertRouteDeclaresAccess } from "./middlewares/access.middleware.js"
import { registerRoutes } from "./modules/index.js"

/** SRS §5.2 · G-1: every route lives under this prefix, including /health. */
export const API_PREFIX = "/api/v1"

// S-4: pino's default request serializer does not log headers, but a custom
// serializer or a `request.log.info(request)` later would. Redact anyway.
const REDACT = ["req.headers.authorization", "req.headers.cookie", 'res.headers["set-cookie"]']

export function defaultLogger(): FastifyServerOptions["logger"] {
  if (env.NODE_ENV === "test") return false
  if (env.NODE_ENV === "development") {
    return { redact: REDACT, transport: { target: "pino-pretty" } }
  }
  return { redact: REDACT }
}

type BuildOptions = {
  logger?: FastifyServerOptions["logger"]
  /** Tests: add probe routes under /api/v1 before the app is sealed. */
  extraRoutes?: (api: FastifyInstance) => Promise<void>
  /** Tests: see every route as it registers (the S-8 table is built from this). */
  onRoute?: (route: RouteOptions) => void
}

export async function buildApp(options: BuildOptions = {}) {
  const app = Fastify({ logger: options.logger ?? defaultLogger() })

  // Registered before any route so it sees every one of them (A-6).
  app.addHook("onRoute", assertRouteDeclaresAccess)
  if (options.onRoute) app.addHook("onRoute", options.onRoute)

  await app.register(helmet)
  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true })
  await app.register(rateLimit, { max: env.RATE_LIMIT_MAX, timeWindow: env.RATE_LIMIT_WINDOW })
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB cap for Excel uploads

  app.setErrorHandler(errorHandler)
  app.addHook("preHandler", accessHook)

  await app.register(
    async (api) => {
      await registerRoutes(api)
      if (options.extraRoutes) await options.extraRoutes(api)
    },
    { prefix: API_PREFIX },
  )

  await app.ready()
  return app
}
