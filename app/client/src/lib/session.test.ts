import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useAuthStore } from "../features/auth/useAuthStore.ts"
import type { Me } from "../types/user.types.ts"
import { resumeSession } from "./session.ts"

/**
 * A reload resumes the session from the refresh cookie (S-2). The refresh
 * answer carries the live account, so the page starts after one round trip,
 * not two (NFR-01); an older server that sends the token alone still works.
 */
const fetchMock = vi.fn<typeof fetch>()
const ME: Me = {
  id: "u1",
  email: "somchai@kmitl.ac.th",
  name: "สมชาย",
  role: "INSTRUCTOR",
  status: "ACTIVE",
  courseCount: 2,
}
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
const paths = () => fetchMock.mock.calls.map(([url]) => new URL(String(url)).pathname)

beforeEach(async () => {
  // refreshSession is single-flight and frees itself on the next tick (apiClient.ts).
  await new Promise((r) => setTimeout(r, 0))
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
  useAuthStore.setState({ status: "checking", me: null, accessToken: null })
})
afterEach(() => vi.unstubAllGlobals())

describe("resumeSession", () => {
  it("signs in from the refresh answer alone, without asking GET /auth/me", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { data: { accessToken: "at", user: ME } }))
    await resumeSession()
    expect(paths()).toEqual(["/api/v1/auth/refresh"])
    expect(useAuthStore.getState()).toMatchObject({ status: "in", me: ME, accessToken: "at" })
  })

  it("asks GET /auth/me when the refresh answer has no account", async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { data: { accessToken: "at" } }))
      .mockResolvedValueOnce(json(200, { data: ME }))
    await resumeSession()
    expect(paths()).toEqual(["/api/v1/auth/refresh", "/api/v1/auth/me"])
    expect(useAuthStore.getState()).toMatchObject({ status: "in", me: ME })
  })

  it("signs out when the cookie is refused", async () => {
    fetchMock.mockResolvedValueOnce(json(401, { message: "x" }))
    await resumeSession()
    expect(useAuthStore.getState()).toMatchObject({ status: "out", me: null, accessToken: null })
  })
})
