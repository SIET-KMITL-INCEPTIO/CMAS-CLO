import { describe, expect, it, vi } from "vitest"
import type { FastifyReply } from "fastify"
import {
  BAD_INPUT,
  badRequest,
  created,
  forbidden,
  NOT_ALLOWED,
  NOT_FOUND,
  notFound,
  ok,
  SERVER_FAULT,
  serverError,
  SIGN_IN_AGAIN,
  unauthorized,
} from "./response.js"

/**
 * Minimal stand-in for FastifyReply: status() returns `this` so the fluent
 * .status().send() chain works, and send() records what was written.
 */
function mockReply() {
  const reply = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      reply.statusCode = code
      return reply
    },
    send: vi.fn((payload: unknown) => {
      reply.body = payload
      return reply
    }),
  }
  return reply as unknown as FastifyReply & typeof reply
}

describe("response helpers", () => {
  it("ok() sends 200 with a success envelope", () => {
    const reply = mockReply()
    ok(reply, { id: "clo_1" })

    expect(reply.statusCode).toBe(200)
    expect(reply.body).toEqual({ success: true, data: { id: "clo_1" } })
  })

  it("created() sends 201 with a success envelope", () => {
    const reply = mockReply()
    created(reply, { id: "clo_2" })

    expect(reply.statusCode).toBe(201)
    expect(reply.body).toEqual({ success: true, data: { id: "clo_2" } })
  })

  it("badRequest() sends 400 and carries the validation errors", () => {
    const reply = mockReply()
    badRequest(reply, { number: ["Required"] })

    expect(reply.statusCode).toBe(400)
    expect(reply.body).toEqual({
      success: false,
      message: BAD_INPUT,
      errors: { number: ["Required"] },
    })
  })

  it.each([
    ["unauthorized", unauthorized, 401, SIGN_IN_AGAIN],
    ["forbidden", forbidden, 403, NOT_ALLOWED],
    ["notFound", notFound, 404, NOT_FOUND],
    ["serverError", serverError, 500, SERVER_FAULT],
  ] as const)("%s() defaults to %i with its documented message", (_name, fn, code, message) => {
    const reply = mockReply()
    fn(reply)

    expect(reply.statusCode).toBe(code)
    expect(reply.body).toEqual({ success: false, message })
  })

  it("allows overriding the default message", () => {
    const reply = mockReply()
    notFound(reply, "CLO not found")

    expect(reply.body).toEqual({ success: false, message: "CLO not found" })
  })

  it("never leaks a data key on error responses", () => {
    const reply = mockReply()
    forbidden(reply)

    expect(reply.body).not.toHaveProperty("data")
  })
})
