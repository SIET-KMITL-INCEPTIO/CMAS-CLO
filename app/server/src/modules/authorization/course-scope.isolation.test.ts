/**
 * S-8 · NFR-07: an instructor of another course gets 404 on every course route.
 *
 * Needs a migrated, SEEDED database, so it runs only when CMAS_DB_TESTS=1 —
 * CI's isolation job sets it after `db:seed`. It only reads: tokens are signed
 * here for the seed's accounts, nothing is written.
 *
 * The table is built from the routes the app actually registers, so a new
 * route with :courseId is tested the day it is added, without anyone editing
 * this file.
 */
import type { FastifyInstance, RouteOptions } from "fastify"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { buildApp } from "../../app.js"
import { prisma } from "../../db/prisma.js"
import { signAccessToken } from "../../lib/jwt.js"

const RUN = process.env.CMAS_DB_TESTS === "1"

// The seed: course A 90641001 taught by instructor1, course B 90641008 by instructor3.
const SEED = {
  admin: "admin@cmas.local",
  teacherA: "instructor1@cmas.local",
  teacherB: "instructor3@cmas.local",
  courseA: "90641001",
}
const UNUSED_ID = "cl00000000000000000000000" // well-formed cuid, no such row

describe.skipIf(!RUN)("course-scope isolation (S-8)", () => {
  let app: FastifyInstance
  const routes: RouteOptions[] = []
  let courseA: string
  const bearer: Record<"admin" | "teacherA" | "teacherB", string> = {
    admin: "",
    teacherA: "",
    teacherB: "",
  }

  beforeAll(async () => {
    app = await buildApp({
      logger: false,
      onRoute: (route) => void routes.push(route),
      // Probes so the gate is exercised end to end before real course routes
      // exist. They go through exactly the hook a real route does.
      extraRoutes: async (api) => {
        api.get(
          "/courses/:courseId/__probe",
          { config: { access: { cap: "course.view" } } },
          async () => ({
            ok: true,
          }),
        )
        api.post(
          "/courses/:courseId/__probe",
          { config: { access: { cap: "score.edit" } } },
          async () => ({
            ok: true,
          }),
        )
      },
    })

    const course = await prisma.course.findFirstOrThrow({
      where: { code: SEED.courseA },
      select: { id: true },
    })
    courseA = course.id
    for (const [key, email] of [
      ["admin", SEED.admin],
      ["teacherA", SEED.teacherA],
      ["teacherB", SEED.teacherB],
    ] as const) {
      const user = await prisma.user.findUniqueOrThrow({
        where: { email },
        select: { id: true, role: true },
      })
      bearer[key] = `Bearer ${await signAccessToken({ sub: user.id, role: user.role })}`
    }
  })

  afterAll(async () => {
    await app?.close()
    await prisma.$disconnect()
  })

  const call = (method: string, url: string, who: keyof typeof bearer) =>
    app.inject({ method: method as "GET", url, headers: { authorization: bearer[who] } })

  /** Fill :courseId with `courseId` and every other :param with an unused id. */
  const fill = (url: string, courseId: string) =>
    url.replace(":courseId", courseId).replace(/:[A-Za-z]+/g, UNUSED_ID)

  it("has course routes to test", () => {
    expect(routes.some((r) => r.url.includes(":courseId"))).toBe(true)
  })

  it("answers 404 to another course's instructor on every :courseId route, same body as a missing course", async () => {
    const courseRoutes = routes.filter((r) => r.url.includes(":courseId") && r.method !== "HEAD")
    for (const route of courseRoutes) {
      const method = String(route.method)
      const foreign = await call(method, fill(route.url, courseA), "teacherB")
      const missing = await call(method, fill(route.url, UNUSED_ID), "teacherB")
      expect(foreign.statusCode, `${method} ${route.url}`).toBe(404)
      expect(foreign.body, `${method} ${route.url} leaks existence`).toBe(missing.body) // A-13
    }
  })

  it("lets the course's own instructor through", async () => {
    expect((await call("GET", `/api/v1/courses/${courseA}/__probe`, "teacherA")).statusCode).toBe(
      200,
    )
    expect((await call("POST", `/api/v1/courses/${courseA}/__probe`, "teacherA")).statusCode).toBe(
      200,
    )
  })

  it("lets ADMIN read the course but not do teaching work (D-1)", async () => {
    expect((await call("GET", `/api/v1/courses/${courseA}/__probe`, "admin")).statusCode).toBe(200)
    expect((await call("POST", `/api/v1/courses/${courseA}/__probe`, "admin")).statusCode).toBe(403)
  })

  it("answers a malformed course id exactly like a missing one", async () => {
    const malformed = await call("GET", "/api/v1/courses/not-an-id/__probe", "teacherA")
    const missing = await call("GET", `/api/v1/courses/${UNUSED_ID}/__probe`, "teacherA")
    expect(malformed.statusCode).toBe(404)
    expect(malformed.body).toBe(missing.body)
  })
})
