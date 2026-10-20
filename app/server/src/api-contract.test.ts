import { readFileSync } from "node:fs"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import type { FastifyInstance, RouteOptions } from "fastify"
import { buildApp } from "./app.js"
import type { RouteAccess } from "./middlewares/access.middleware.js"
import type { Capability } from "./modules/authorization/capabilities.js"

/**
 * The API design (docs/excel/api/api-endpoints.json, built by
 * scripts/build-api-endpoints-workbook.py) checked against the running server.
 * No database needed: nothing here reaches a query.
 *
 *  1. Every route the server registers is a "done" row of the design, with the
 *     same method, path and access — and every "done" row is registered.
 *  2. Every designed endpoint can be registered on this server with the access
 *     the design gives it (the server refuses to boot on an impossible one).
 *  3. The implemented endpoints answer the status codes the design promises
 *     for a caller with no token and for a malformed body.
 *
 * scripts/check-api-design.py checks the same file against the schema, the
 * capability table and the test plan.
 */

/** The methods the design uses — a subset both Fastify and light-my-request accept. */
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type Endpoint = {
  n: number
  method: Method
  path: string
  fullPath: string
  role: string
  courseScope: string
  capability: string
  status: "done" | "contract" | "new" | "later"
  design: { success: string; errors: string } | null
}

const DESIGN_JSON = new URL("../../../docs/excel/api/api-endpoints.json", import.meta.url)
const { prefix, endpoints } = JSON.parse(readFileSync(DESIGN_JSON, "utf8")) as {
  prefix: string
  endpoints: Endpoint[]
}

const PUBLIC = "ไม่ต้องล็อกอิน"
const LOGGED_IN = "ผู้ใช้ที่ล็อกอิน"
const RESOLVE = "resolve จาก id"
const NO_CAPABILITY = ["อ่าน", "—"]

/** The design's "who may call" + capability, in the server's own terms. */
function accessOf(e: Endpoint): RouteAccess {
  if (e.role === PUBLIC) return "public"
  if (NO_CAPABILITY.includes(e.capability)) {
    // A read of course data is guarded by course.view; a read with no course is any signed-in user.
    return e.role === LOGGED_IN ? "authenticated" : { cap: "course.view" }
  }
  return { cap: e.capability as Capability }
}

const sameAccess = (a: RouteAccess | undefined, b: RouteAccess) =>
  JSON.stringify(a) === JSON.stringify(b)
// "/users/" and "/users" are one route: a module registered at a prefix serves both
const shape = (url: string) => url.replace(/:\w+/g, ":_").replace(/(.)\/$/, "$1")

const inScope = endpoints.filter((e) => e.status !== "later")
const done = endpoints.filter((e) => e.status === "done")
const toBuild = inScope.filter((e) => e.status !== "done")
// A route whose course is found from a leaf id (/clos/:cloId) needs the A-3 resolver,
// which access.middleware.ts does not have yet: it accepts a course capability only
// on a path with :courseId.
const needsResolver = (e: Endpoint) => {
  const a = accessOf(e)
  return (
    e.courseScope === RESOLVE &&
    typeof a === "object" &&
    !e.path.includes(":courseId") &&
    a.cap !== "user.manage" &&
    a.cap !== "course.create"
  )
}

let app: FastifyInstance
const registered: RouteOptions[] = []

beforeAll(async () => {
  app = await buildApp({ logger: false, onRoute: (r) => void registered.push(r) })
})

afterAll(async () => {
  await app.close()
})

describe("design file", () => {
  it("has one Design row for every in-scope endpoint", () => {
    expect(inScope.filter((e) => e.design === null).map((e) => `${e.method} ${e.path}`)).toEqual([])
  })

  it("uses the server's prefix", () => {
    expect(prefix).toBe("/api/v1")
  })
})

describe("routes the server registers = the design's done rows", () => {
  const api = () =>
    registered
      .filter((r) => r.method !== "HEAD" && r.method !== "OPTIONS" && r.url !== `${prefix}/health`)
      .map((r) => ({
        method: String(r.method),
        url: r.url,
        access: (r.config as { access?: RouteAccess } | undefined)?.access,
      }))

  it("registers no route the design does not mark done", () => {
    const doneShapes = new Set(done.map((e) => `${e.method} ${shape(e.fullPath)}`))
    expect(api().filter((r) => !doneShapes.has(`${r.method} ${shape(r.url)}`))).toEqual([])
  })

  it.each(done.map((e) => [`${e.method} ${e.path}`, e] as const))(
    "%s is registered with the designed access",
    (_name, e) => {
      const r = api().find((x) => x.method === e.method && shape(x.url) === shape(e.fullPath))
      expect(r, "route is missing").toBeDefined()
      expect(sameAccess(r!.access, accessOf(e))).toBe(true)
    },
  )
})

describe("every designed endpoint can be built on this server", () => {
  const ready = toBuild.filter((e) => !needsResolver(e))
  const blocked = toBuild.filter(needsResolver)

  it.each(ready.map((e) => [`${e.method} ${e.path}`, e] as const))(
    "%s registers with its access",
    async (_name, e) => {
      const probe = await buildApp({
        logger: false,
        extraRoutes: async (api) =>
          void api.route({
            method: e.method,
            url: e.path,
            config: { access: accessOf(e) },
            handler: async () => "designed",
          }),
      })
      await probe.close()
    },
  )

  // Expected to fail until access.middleware.ts can resolve courseId from a leaf id
  // (A-3). When the resolver lands these start passing — and it.fails turns red, which
  // is the signal to move them into the list above.
  it.fails.each(blocked.map((e) => [`${e.method} ${e.path}`, e] as const))(
    "%s registers once the A-3 resolver exists",
    async (_name, e) => {
      const probe = await buildApp({
        logger: false,
        extraRoutes: async (api) =>
          void api.route({
            method: e.method,
            url: e.path,
            config: { access: accessOf(e) },
            handler: async () => "designed",
          }),
      })
      await probe.close()
    },
  )
})

describe("implemented endpoints answer as designed", () => {
  const statuses = (text: string) =>
    new Set([...text.matchAll(/(?:^|·)\s*([1-5]\d\d)\b/g)].map((m) => Number(m[1])))

  it.each(done.filter((e) => e.role !== PUBLIC).map((e) => [`${e.method} ${e.path}`, e] as const))(
    "%s refuses a caller with no token with 401",
    async (_name, e) => {
      expect(statuses(e.design!.errors).has(401)).toBe(true)
      const res = await app.inject({ method: e.method, url: e.fullPath.replace(/:\w+/g, "x") })
      expect(res.statusCode).toBe(401)
      expect(res.json()).toMatchObject({ success: false })
    },
  )

  it.each(
    done.filter((e) => e.method === "POST").map((e) => [`${e.method} ${e.path}`, e] as const),
  )("%s refuses a malformed body with 400", async (_name, e) => {
    expect(statuses(e.design!.errors).has(400)).toBe(true)
    const res = await app.inject({ method: e.method, url: e.fullPath, payload: { wrong: true } })
    expect(res.statusCode).toBe(400)
  })
})
