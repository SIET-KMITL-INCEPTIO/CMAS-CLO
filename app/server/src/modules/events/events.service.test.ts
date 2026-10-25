import { describe, expect, it, vi } from "vitest"
import { EventService, type Subscriber } from "./events.service.js"

const teaches: Record<string, string[]> = { c1: ["u1", "u2"], c2: ["u3"] }

function setup() {
  const repo = { userIdsOf: vi.fn(async (courseId: string) => teaches[courseId] ?? []) }
  const service = new EventService(repo)
  const heard: Record<string, string[]> = {}
  const listen = (userId: string, role: Subscriber["role"] = "INSTRUCTOR") =>
    service.subscribe({ userId, role, send: (d) => (heard[userId] ??= []).push(d) })
  return { service, repo, heard, listen }
}

describe("EventService", () => {
  it("tells the course's instructors and every ADMIN, nobody else", async () => {
    const { service, heard, listen } = setup()
    listen("u1")
    listen("u2")
    listen("u3")
    listen("admin", "ADMIN")

    await service.courseChanged({ courseId: "c1", origin: "tab-a" }, "u1")

    expect(heard.u1).toEqual([JSON.stringify({ courseId: "c1", origin: "tab-a" })])
    expect(heard.u2).toHaveLength(1)
    expect(heard.admin).toHaveLength(1)
    // A-13: an instructor of another course is never told this course exists.
    expect(heard.u3).toBeUndefined()
  })

  it("still reaches the writer when nobody teaches the course any more (it was deleted)", async () => {
    const { service, heard, listen } = setup()
    listen("u9")

    await service.courseChanged({ courseId: "gone" }, "u9")

    expect(heard.u9).toHaveLength(1)
  })

  it("does not query the database while nobody is listening", async () => {
    const { service, repo } = setup()
    await service.courseChanged({ courseId: "c1" }, "u1")
    expect(repo.userIdsOf).not.toHaveBeenCalled()
  })

  it("stops sending after unsubscribe", async () => {
    const { service, heard, listen } = setup()
    const off = listen("u1")
    off()
    await service.courseChanged({ courseId: "c1" }, "u2")
    expect(heard.u1).toBeUndefined()
    expect(service.size).toBe(0)
  })
})
