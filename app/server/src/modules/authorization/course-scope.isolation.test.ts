/**
 * S-8 · NFR-07: an instructor of another course gets 404 on every course route.
 *
 * Needs a migrated database, so it runs only when CMAS_DB_TESTS=1. It builds
 * its own course A (taught by teacherA) with one row of every leaf kind, then
 * calls every registered route as teacherB.
 *
 * The table is built from the routes the app actually registers, so a new
 * route with :courseId or a leaf id (/clos/:cloId, /students/:studentId, ...)
 * is tested the day it is added, without anyone editing this file.
 */
import type { RouteOptions } from "fastify"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { buildApp } from "../../app.js"
import { prisma } from "../../db/prisma.js"
import {
  courseBody,
  RUN_DB_TESTS,
  setupFixture,
  UNUSED_ID,
  type Fixture,
} from "../../test/db-fixture.js"

const SCOPED = /:(courseId|cloId|objectiveId|activityId|studentId|uploadId)(?:\/|$)/

describe.skipIf(!RUN_DB_TESTS)("course-scope isolation (S-8)", () => {
  let f: Fixture
  const routes: RouteOptions[] = []
  const ids: Record<string, string> = {}

  beforeAll(async () => {
    f = await setupFixture()
    // Collect the route table from a second instance with an onRoute hook.
    const probe = await buildApp({ logger: false, onRoute: (r) => void routes.push(r) })
    await probe.close()

    const call = (url: string, payload: object) =>
      f
        .call("teacherA", { method: "POST", url: `/api/v1${url}`, payload })
        .then((r) => r.json().data)
    ids.courseId = (await call("/courses", courseBody("TEST-S8"))).id
    ids.cloId = (
      await call(`/courses/${ids.courseId}/clos`, {
        number: 1,
        description: "c",
        bloomLevel: "APPLY",
      })
    ).id
    ids.objectiveId = (
      await call(`/clos/${ids.cloId}/objectives`, { number: 1, description: "o", weight: 100 })
    ).id
    ids.activityId = (
      await call(`/courses/${ids.courseId}/activities`, {
        name: "a",
        type: "TEST",
        maxScore: 10,
        weight: 100,
      })
    ).id
    ids.studentId = (
      await call(`/courses/${ids.courseId}/students`, { studentCode: "S8", name: "s" })
    ).id
    ids.uploadId = (
      await prisma.scoreUploadLog.create({
        data: {
          courseId: ids.courseId,
          uploadedBy: f.users.teacherA.id,
          fileName: "x.xlsx",
          recordsOk: 0,
          recordsFail: 0,
        },
      })
    ).id
    ids.userId = f.users.teacherA.id
  }, 120_000)

  afterAll(async () => {
    await f?.close()
  }, 60_000)

  const fill = (url: string, real: boolean) =>
    url.replace(/:([A-Za-z]+)/g, (_, name: string) => (real ? (ids[name] ?? UNUSED_ID) : UNUSED_ID))

  it("has scoped routes to test", () => {
    expect(routes.filter((r) => SCOPED.test(r.url)).length).toBeGreaterThan(40)
  })

  it("answers 404 to another course's instructor on every scoped route, same body as a missing row", async () => {
    const scoped = routes.filter((r) => SCOPED.test(r.url) && r.method !== "HEAD")
    for (const route of scoped) {
      const method = String(route.method) as "GET"
      const foreign = await f.call("teacherB", { method, url: fill(route.url, true) })
      const missing = await f.call("teacherB", { method, url: fill(route.url, false) })
      expect(foreign.statusCode, `${method} ${route.url}`).toBe(404)
      expect(foreign.body, `${method} ${route.url} leaks existence`).toBe(missing.body) // A-13
    }
  }, 600_000)

  it("answers a malformed id exactly like a missing one", async () => {
    for (const url of [
      "/api/v1/courses/not-an-id",
      "/api/v1/clos/not-an-id/objectives",
      "/api/v1/uploads/x/errors",
    ]) {
      const malformed = await f.call("teacherA", { method: "GET", url })
      expect(malformed.statusCode, url).toBe(404)
    }
  })

  it("lets ADMIN read the course but not do teaching work (D-1)", async () => {
    expect(
      (await f.call("admin", { method: "GET", url: `/api/v1/clos/${ids.cloId}/objectives` }))
        .statusCode,
    ).toBe(200)
    const write = await f.call("admin", {
      method: "PATCH",
      url: `/api/v1/clos/${ids.cloId}`,
      payload: { description: "x" },
    })
    expect(write.statusCode).toBe(403)
  })
})
