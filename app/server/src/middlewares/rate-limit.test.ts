import type { FastifyRequest } from "fastify"
import { describe, expect, it } from "vitest"
import { EXCEL_TOKEN_PREFIX } from "../modules/excel/excel.service.js"
import { rateLimitKey, rateLimitMax } from "./rate-limit.js"

const req = (authorization?: string) =>
  ({ ip: "10.0.0.7", headers: authorization ? { authorization } : {} }) as FastifyRequest

describe("rate limit buckets", () => {
  it("counts the web app per IP, as before", () => {
    expect(rateLimitKey(req())).toBe("10.0.0.7")
    expect(rateLimitKey(req("Bearer eyJhbGciOi.jwt"))).toBe("10.0.0.7")
  })

  it("counts Excel requests per IP in a bucket of their own", () => {
    expect(rateLimitKey(req(`Bearer ${EXCEL_TOKEN_PREFIX}abc`))).toBe("excel:10.0.0.7")
  })

  it("never keys by the token, so changing it does not open a fresh bucket", () => {
    expect(rateLimitKey(req(`Bearer ${EXCEL_TOKEN_PREFIX}one`))).toBe(
      rateLimitKey(req(`Bearer ${EXCEL_TOKEN_PREFIX}two`)),
    )
  })

  it("gives each bucket its own ceiling", () => {
    const max = rateLimitMax(100, 1200)
    expect(max(req(), "10.0.0.7")).toBe(100)
    expect(max(req(), "excel:10.0.0.7")).toBe(1200)
  })
})
