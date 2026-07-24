import Fastify from "fastify"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import multipart from "@fastify/multipart"
import { env } from "./lib/env.js"
import { errorHandler } from "./middlewares/errorHandler.js"
import { registerRoutes } from "./routes/index.js"

const app = Fastify({
  logger: env.NODE_ENV === "development" ? { transport: { target: "pino-pretty" } } : true,
})

await app.register(helmet)
await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true })
await app.register(rateLimit, { max: env.RATE_LIMIT_MAX, timeWindow: env.RATE_LIMIT_WINDOW })
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB cap for Excel uploads

app.setErrorHandler(errorHandler)

await registerRoutes(app)

app
  .listen({ port: env.PORT, host: "0.0.0.0" })
  .then(() => app.log.info(`Server running on port ${env.PORT}`))
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
