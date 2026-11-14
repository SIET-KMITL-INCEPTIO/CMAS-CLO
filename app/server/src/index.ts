import { buildApp } from "./app.js"
import { prisma } from "./db/prisma.js"
import { env } from "./lib/env.js"

const app = await buildApp()

// Query text and timing only: Prisma's `params` can carry emails and tokens.
prisma.$on("query", (e) => {
  if (env.NODE_ENV !== "production")
    app.log.info({ durationMs: e.duration, query: e.query }, "db query")
})
prisma.$on("warn", (e) => app.log.warn(e.message))
prisma.$on("error", (e) => app.log.error(e.message))

/** Connection check at boot. A dead database is logged loudly but does not stop the server. */
async function checkDatabase() {
  const startedAt = performance.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    const host = new URL(env.DATABASE_URL).host
    app.log.info(
      { host, latencyMs: Math.round(performance.now() - startedAt) },
      "Database connected (Supabase PostgreSQL)",
    )
  } catch (err) {
    app.log.error({ err }, "Database connection FAILED — check DATABASE_URL in app/server/.env")
  }
}

app
  // "::" is dual-stack: Windows resolves `localhost` to ::1 first, and an IPv4-only
  // listener made every browser request wait ~200 ms for that attempt to fail.
  .listen({ port: env.PORT, host: "::" })
  .then(() => {
    app.log.info(`Server running on port ${env.PORT}`)
    return checkDatabase()
  })
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
