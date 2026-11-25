import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError, apiClient, messageFor, NETWORK_MESSAGE, NETWORK_STATUS } from "./apiClient.ts"
import { errorText } from "./errorText.ts"

/**
 * #69 · NFR-10: whatever goes wrong, the user reads Thai and what to do next —
 * never the browser's "Failed to fetch".
 */
const fetchMock = vi.fn<typeof fetch>()
beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

/** The error a call ends in, so a test can look at it without try/catch. */
const failure = (p: Promise<unknown>) =>
  p.then(
    () => {
      throw new Error("expected the call to fail")
    },
    (e: unknown) => e,
  )

describe("no reply at all (offline, server down)", () => {
  it.each(["get", "post", "put", "patch", "delete"] as const)(
    "%s: a Thai ApiError with status 0, not the browser's English",
    async (method) => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"))
      const err = await failure(
        method === "get" || method === "delete"
          ? apiClient[method]("/courses")
          : apiClient[method]("/courses", { a: 1 }),
      )
      expect(err).toBeInstanceOf(ApiError)
      expect(err).toMatchObject({ status: NETWORK_STATUS, message: NETWORK_MESSAGE })
      expect((err as Error).message).not.toMatch(/fetch/i)
    },
  )

  it("an upload and a download say the same", async () => {
    fetchMock.mockRejectedValue(new TypeError("NetworkError when attempting to fetch resource."))
    const file = new File(["x"], "scores.xlsx")
    expect(await failure(apiClient.upload("/import", file))).toMatchObject({
      message: NETWORK_MESSAGE,
    })
    expect(await failure(apiClient.download("/export"))).toMatchObject({
      message: NETWORK_MESSAGE,
    })
  })

  it("a download whose body breaks off half way says the same", async () => {
    const res = new Response("x", { status: 200 })
    vi.spyOn(res, "blob").mockRejectedValue(new TypeError("network error"))
    fetchMock.mockResolvedValue(res)
    expect(await failure(apiClient.download("/export"))).toMatchObject({
      message: NETWORK_MESSAGE,
    })
  })

  it("a cancelled request stays a cancel, so nothing is shown for it", async () => {
    const abort = new DOMException("The operation was aborted.", "AbortError")
    fetchMock.mockRejectedValue(abort)
    expect(await failure(apiClient.get("/courses"))).toBe(abort)
  })

  it("the page-level text agrees, for apiClient and for a raw fetch", () => {
    expect(errorText(new ApiError(NETWORK_STATUS, NETWORK_MESSAGE))).toBe(NETWORK_MESSAGE)
    expect(errorText(new TypeError("Failed to fetch"))).toBe(NETWORK_MESSAGE)
  })
})

describe("a reply", () => {
  it("gives the data of the envelope", async () => {
    fetchMock.mockResolvedValue(json(200, { data: { id: "k1" } }))
    expect(await apiClient.get("/courses/k1")).toEqual({ id: "k1" })
  })

  it("keeps the server's own Thai message", async () => {
    fetchMock.mockResolvedValue(json(422, { message: "น้ำหนักรวมเกิน 100%", errors: { w: 1 } }))
    expect(await failure(apiClient.post("/x", {}))).toMatchObject({
      status: 422,
      message: "น้ำหนักรวมเกิน 100%",
      errors: { w: 1 },
    })
  })

  it("falls back to Thai when the reply has no message (a proxy's page)", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Bad Gateway</html>", { status: 502 }))
    expect(await failure(apiClient.get("/x"))).toMatchObject({
      status: 502,
      message: messageFor(502),
    })
  })
})
