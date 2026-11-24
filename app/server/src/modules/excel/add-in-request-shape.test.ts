/**
 * What the Excel add-in's HTTP layer must and must not send (FR-73).
 *
 * POST /excel/device has no body. app.inject() sends no Content-Type for a
 * request without a body, so the DB tests never saw what a real HTTP client
 * does: WinHttp and curl both send the header the add-in asks for. A JSON
 * Content-Type with an empty body is a 400 from Fastify, which made the first
 * call of every sign-in fail until the add-in learned to send the header only
 * with a body (modCmasHttp.bas, CMAS.applescript). The add-in's source is
 * checked for that by `build-excel-addin.py check`; this test pins the server
 * side of the contract, so a change in Fastify or its parser shows up here.
 */
import type { FastifyInstance } from "fastify"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { buildApp } from "../../app.js"

describe("a request with no body, as the add-in makes it", () => {
  let app: FastifyInstance
  beforeAll(async () => {
    app = await buildApp({
      extraRoutes: async (api) => {
        api.post("/__no-body", { config: { access: "public" } }, async () => ({ ok: true }))
      },
    })
  })
  afterAll(async () => app.close())

  const post = (headers: Record<string, string>, payload?: string) =>
    app.inject({
      method: "POST",
      url: "/api/v1/__no-body",
      headers,
      ...(payload ? { payload } : {}),
    })

  it("is fine with no Content-Type at all", async () => {
    expect((await post({})).statusCode).toBe(200)
  })

  it("is a 400 when it claims JSON and sends nothing: the add-in must not do that", async () => {
    const res = await post({ "content-type": "application/json; charset=utf-8" })
    expect(res.statusCode).toBe(400)
  })

  it("is fine when it claims JSON and sends some", async () => {
    const res = await post({ "content-type": "application/json; charset=utf-8" }, '{"a":1}')
    expect(res.statusCode).toBe(200)
  })
})
