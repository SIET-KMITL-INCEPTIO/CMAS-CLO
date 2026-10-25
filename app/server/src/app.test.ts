import { Writable } from "node:stream"
import { Prisma } from "@prisma/client"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildApp } from "./app.js"
import { BusinessRuleError } from "./lib/errors.js"
import { signRefreshToken } from "./lib/jwt.js"
import { CourseNotFoundError } from "./modules/authorization/authorization.service.js"

/** No database needed: nothing here reaches a query. */

const STUDENT_CODE = "6604101028"
const logs: string[] = []
const logStream = new Writable({
  write(chunk, _enc, done) {
    logs.push(String(chunk))
    done()
  },
})

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp({
    logger: { level: "info", stream: logStream },
    extraRoutes: async (api) => {
      const access = "public" as const
      api.get("/__test/course-not-found", { config: { access } }, async () => {
        throw new CourseNotFoundError()
      })
      api.get("/__test/rule", { config: { access } }, async () => {
        throw new BusinessRuleError("กิจกรรมนี้ปิดรับคะแนนแล้ว")
      })
      api.get("/__test/duplicate", { config: { access } }, async () => {
        throw new Prisma.PrismaClientKnownRequestError(
          `Unique constraint failed on studentCode ${STUDENT_CODE}`,
          { code: "P2002", clientVersion: "test" },
        )
      })
      api.get("/__test/bug", { config: { access } }, async () => {
        throw new Error(`could not process ${STUDENT_CODE}`)
      })
    },
  })
})

afterAll(async () => {
  await app.close()
})

describe("CORS", () => {
  it("lets the front end send PATCH and DELETE, not only GET and POST", async () => {
    const res = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/courses/x",
      headers: {
        origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
        "access-control-request-method": "DELETE",
      },
    })
    expect(res.statusCode).toBe(204)
    const allowed = String(res.headers["access-control-allow-methods"])
    for (const m of ["PUT", "PATCH", "DELETE"]) expect(allowed).toContain(m)
  })
})

describe("route access declarations (A-6)", () => {
  it("refuses to boot when a route declares no access", async () => {
    await expect(
      buildApp({
        logger: false,
        extraRoutes: async (api) => void api.get("/__open", async () => "x"),
      }),
    ).rejects.toThrow(/has no config\.access/)
  })

  it("refuses a course capability on a path without :courseId", async () => {
    await expect(
      buildApp({
        logger: false,
        extraRoutes: async (api) =>
          void api.post(
            "/__scores",
            { config: { access: { cap: "score.edit" } } },
            async () => "x",
          ),
      }),
    ).rejects.toThrow(/has no :courseId/)
  })
})

describe("prefix (G-1)", () => {
  it("serves /api/v1/health", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/health" })
    expect(res.statusCode).toBe(200)
  })

  it("no longer serves /health", async () => {
    const res = await app.inject({ method: "GET", url: "/health" })
    expect(res.statusCode).toBe(404)
  })
})

describe("authentication (S-1)", () => {
  it("rejects a request with no token", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/users" })
    expect(res.statusCode).toBe(401)
  })

  it("rejects a refresh token sent as a Bearer token", async () => {
    const refresh = await signRefreshToken({ sub: "u1", role: "ADMIN" })
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/users",
      headers: { authorization: `Bearer ${refresh}` },
    })
    expect(res.statusCode).toBe(401)
  })
})

describe("error mapping (S-3)", () => {
  it.each([
    ["/api/v1/__test/course-not-found", 404],
    ["/api/v1/__test/rule", 422],
    ["/api/v1/__test/duplicate", 409],
    ["/api/v1/__test/bug", 500],
  ])("%s → %i", async (url, status) => {
    const res = await app.inject({ method: "GET", url })
    expect(res.statusCode).toBe(status)
    expect(res.json()).toMatchObject({ success: false })
  })

  it("keeps a framework 4xx instead of turning it into 500", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/google",
      headers: { "content-type": "application/json" },
      payload: "{not json",
    })
    expect(res.statusCode).toBe(400)
  })

  it("does not put an unexpected error's message in the response", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/__test/bug" })
    expect(res.body).not.toContain(STUDENT_CODE)
  })
})

describe("logging (S-4)", () => {
  it("never writes a value from an error message to the log", async () => {
    logs.length = 0
    await app.inject({ method: "GET", url: "/api/v1/__test/duplicate" })
    await app.inject({ method: "GET", url: "/api/v1/__test/bug" })
    expect(logs.join("")).toContain("unhandled error")
    expect(logs.join("")).not.toContain(STUDENT_CODE)
  })

  it("does not log the Authorization header", async () => {
    logs.length = 0
    await app.inject({
      method: "GET",
      url: "/api/v1/health",
      headers: { authorization: "Bearer secret-token-value" },
    })
    expect(logs.join("")).not.toContain("secret-token-value")
  })
})
