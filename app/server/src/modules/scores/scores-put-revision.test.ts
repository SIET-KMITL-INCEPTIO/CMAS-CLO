import { describe, expect, it, vi } from "vitest"
import { ConflictError } from "../../lib/errors.js"
import type { ScoreRepository } from "./score.repository.js"
import { ScoreService } from "./scores.service.js"

const cell = { studentId: "s1", activityId: "a1", score: 8, from: null }

function setup(conflicts: unknown[] = [], bump = vi.fn(async () => 42 as number | null)) {
  const scores = {
    context: vi.fn(async () => ({
      students: [{ id: "s1", studentCode: "6501", status: "ENROLLED", grade: null }],
      activities: [{ id: "a1", name: "สอบ", maxScore: 10, closedAt: null }],
    })),
    writeIfUnchanged: vi.fn(async () => ({ conflicts, written: conflicts.length ? 0 : 1 })),
  } as unknown as ScoreRepository
  return { service: new ScoreService(scores, { bump }), bump }
}

describe("PUT scores tells the writer the revision its write made (FR-76)", () => {
  it("moves the course revision once and returns the new number", async () => {
    const { service, bump } = setup()
    const out = await service.put("c1", { scores: [cell], source: "MANUAL" }, "u1")
    expect(out).toEqual({ written: 1, unchanged: 0, revision: 42 })
    expect(bump).toHaveBeenCalledExactlyOnceWith("c1")
  })

  it("does not move it when nothing was written (409)", async () => {
    const { service, bump } = setup([{ studentId: "s1", activityId: "a1", current: null }])
    await expect(
      service.put("c1", { scores: [cell], source: "MANUAL" }, "u1"),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(bump).not.toHaveBeenCalled()
  })

  it("still answers with the write when the bump fails, with no revision", async () => {
    const { service } = setup(
      [],
      vi.fn(async () => {
        throw new Error("db down")
      }),
    )
    const out = await service.put("c1", { scores: [cell], source: "MANUAL" }, "u1")
    expect(out).toEqual({ written: 1, unchanged: 0, revision: null })
  })
})
