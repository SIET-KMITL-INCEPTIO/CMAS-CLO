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
import { captureCreatedCourse, publishCourseChange } from "./middlewares/live-updates.middleware.js"
import { rateLimitKey, rateLimitMax } from "./middlewares/rate-limit.js"
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
  // Typed up front: a union-typed trustProxy otherwise steers Fastify's overloads to HTTP/2.
  const serverOptions: FastifyServerOptions = {
    logger: options.logger ?? defaultLogger(),
    // A hop count is given as a function: Fastify's types take no number.
    trustProxy:
      typeof env.TRUST_PROXY === "number"
        ? (
            (hops: number) => (_address: string, hop: number) =>
              hop < hops
          )(env.TRUST_PROXY)
        : env.TRUST_PROXY,
  }
  const app = Fastify(serverOptions)

  // Registered before any route so it sees every one of them (A-6).
  app.addHook("onRoute", assertRouteDeclaresAccess)
  if (options.onRoute) app.addHook("onRoute", options.onRoute)

  await app.register(helmet)
  // @fastify/cors allows only GET, HEAD and POST unless told otherwise; the
  // browser then refuses every PATCH, PUT and DELETE at the preflight.
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"],
    // A cross-origin fetch hides every response header not listed here; without
    // it the client never sees an export's file name and falls back to a generic one.
    exposedHeaders: ["Content-Disposition"],
  })
  await app.register(rateLimit, {
    keyGenerator: rateLimitKey,
    max: rateLimitMax(env.RATE_LIMIT_MAX, env.RATE_LIMIT_EXCEL_MAX),
    timeWindow: env.RATE_LIMIT_WINDOW,
  })
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB cap for Excel uploads

  app.setErrorHandler(errorHandler)
  app.addHook("preHandler", accessHook)
  app.addHook("onSend", captureCreatedCourse)
  app.addHook("onResponse", publishCourseChange)

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
