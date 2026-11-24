/**
 * The Excel add-in's token through the real access hook (FR-74, ST-XL-02/03).
 * The database is mocked: the caller is an active INSTRUCTOR who can see EVERY
 * course, so each 404 below comes from the token's own limits, not from
 * course visibility.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import type { FastifyInstance } from "fastify"

const COURSE_A = "cjld2cjxh0000qzrmn831i7rn"
const COURSE_B = "cjld2cjxh0001qzrmn831i7rn"
const TOKEN = "cmasx_" + "t".repeat(43)

const db = vi.hoisted(() => ({
  link: null as { id: string; userId: string; courseId: string } | null,
  user: { role: "INSTRUCTOR", isActive: true, status: "ACTIVE" } as Record<string, unknown> | null,
}))

vi.mock("../db/prisma.js", () => ({
  prisma: {
    excelLink: {
      findFirst: vi.fn(async () => db.link),
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
    user: { findUnique: vi.fn(async () => db.user) },
    course: { findFirst: vi.fn(async (q: { where: { id: string } }) => ({ id: q.where.id })) },
    // live-updates bumps Course.revision after every successful write.
    $executeRaw: vi.fn(async () => 1),
    authEvent: { create: vi.fn(async () => ({})) },
  },
}))

const { buildApp } = await import("../app.js")

let app: FastifyInstance
beforeAll(async () => {
  app = await buildApp({
    extraRoutes: async (api) => {
      const ok = async () => ({ ok: true })
      api.get("/probe/courses/:courseId/view", { config: { access: { cap: "course.view" } } }, ok)
      api.put("/probe/courses/:courseId/scores", { config: { access: { cap: "score.edit" } } }, ok)
      api.post(
        "/probe/courses/:courseId/import",
        { config: { access: { cap: "score.import" } } },
        ok,
      )
      api.get("/probe/me", { config: { access: "authenticated" } }, ok)
      api.get("/probe/public", { config: { access: "public" } }, ok)
    },
  })
})
afterAll(async () => app.close())
beforeEach(() => {
  db.link = { id: "l1", userId: "u1", courseId: COURSE_A }
  db.user = { role: "INSTRUCTOR", isActive: true, status: "ACTIVE" }
})

const call = (method: "GET" | "PUT" | "POST", url: string, payload?: object) =>
  app.inject({
    method,
    url: `/api/v1${url}`,
    headers: { authorization: `Bearer ${TOKEN}` },
    ...(payload ? { payload } : {}),
  })

describe("an add-in token for course A", () => {
  it("reads and writes scores of course A", async () => {
    expect((await call("GET", `/probe/courses/${COURSE_A}/view`)).statusCode).toBe(200)
    expect((await call("PUT", `/probe/courses/${COURSE_A}/scores`)).statusCode).toBe(200)
  })

  it("gets 404 on course B, though the account itself can see B", async () => {
    expect((await call("GET", `/probe/courses/${COURSE_B}/view`)).statusCode).toBe(404)
    expect((await call("PUT", `/probe/courses/${COURSE_B}/scores`)).statusCode).toBe(404)
  })

  it("gets 404 for any other capability on its own course", async () => {
    expect((await call("POST", `/probe/courses/${COURSE_A}/import`)).statusCode).toBe(404)
  })

  it("gets 404 on signed-in routes (profile, links)", async () => {
    expect((await call("GET", "/probe/me")).statusCode).toBe(404)
    expect((await call("GET", "/excel/links")).statusCode).toBe(404)
  })

  it("cannot approve a new add-in code, even for course A (webSessionOnly)", async () => {
    const res = await call("POST", `/courses/${COURSE_A}/excel-links`, { userCode: "ABCD2345" })
    expect(res.statusCode).toBe(404)
  })

  it("still reaches public routes", async () => {
    expect((await call("GET", "/probe/public")).statusCode).toBe(200)
  })

  it("is 401 once revoked or expired (no live link)", async () => {
    db.link = null
    expect((await call("GET", `/probe/courses/${COURSE_A}/view`)).statusCode).toBe(401)
  })

  it("is 401 once the account is deactivated: the live User row is re-read", async () => {
    db.user = { role: "INSTRUCTOR", isActive: false, status: "ACTIVE" }
    expect((await call("GET", `/probe/courses/${COURSE_A}/view`)).statusCode).toBe(401)
  })
})
