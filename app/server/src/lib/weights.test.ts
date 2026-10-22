import { describe, expect, it } from "vitest"
import { computedCloWeights, groupKey, splitGroupWeights, sumBy } from "./weights.js"

describe("computedCloWeights (CR-02)", () => {
  it("gives each CLO the activity weight times the share of it that measures the CLO", () => {
    const activities = [
      { id: "quiz", weight: 20 },
      { id: "exam", weight: 80 },
    ]
    const cells = [
      { activityId: "quiz", objectiveId: "o1", weight: 100 },
      { activityId: "exam", objectiveId: "o1", weight: 25 },
      { activityId: "exam", objectiveId: "o2", weight: 75 },
    ]
    const clo = new Map([
      ["o1", "clo1"],
      ["o2", "clo2"],
    ])
    expect(Object.fromEntries(computedCloWeights(activities, cells, clo))).toEqual({
      clo1: 40,
      clo2: 60,
    })
  })

  it("ignores a cell whose objective or activity is not in the course", () => {
    const out = computedCloWeights(
      [{ id: "a", weight: 50 }],
      [{ activityId: "x", objectiveId: "o", weight: 100 }],
      new Map([["o", "c"]]),
    )
    expect(out.size).toBe(0)
  })
})

describe("splitGroupWeights (N1/N2)", () => {
  it("splits a group by maxScore and keeps the group's exact total", () => {
    const acts = [
      { id: "l1", type: "LAB", typeLabel: "", maxScore: 10 },
      { id: "l2", type: "LAB", typeLabel: "", maxScore: 20 },
      { id: "l3", type: "LAB", typeLabel: "", maxScore: 20 },
      { id: "t1", type: "TEST", typeLabel: "", maxScore: 100 },
    ]
    const out = splitGroupWeights(acts, { LAB: 25, TEST: 75 })
    expect(out.get("l1")).toBe(5)
    expect(out.get("l2")).toBe(10)
    expect(out.get("l3")).toBe(10)
    expect(out.get("t1")).toBe(75)
  })

  it("puts the rounding remainder on the last activity so the group sums exactly", () => {
    const acts = [1, 2, 3].map((i) => ({ id: `a${i}`, type: "LAB", typeLabel: "", maxScore: 10 }))
    const out = splitGroupWeights(acts, { LAB: 10 })
    expect([...out.values()].reduce((s, w) => s + w, 0)).toBeCloseTo(10, 10)
    expect(out.get("a3")).toBe(3.34)
  })

  it("treats each custom type name as its own group, and a group with no weight as 0", () => {
    expect(groupKey({ type: "CUSTOM", typeLabel: "สัมมนา" })).toBe("CUSTOM:สัมมนา")
    const out = splitGroupWeights(
      [{ id: "s", type: "CUSTOM", typeLabel: "สัมมนา", maxScore: 5 }],
      {},
    )
    expect(out.get("s")).toBe(0)
  })
})

describe("sumBy", () => {
  it("sums per key, rounded to 2 decimals", () => {
    const out = sumBy(
      [
        { k: "a", v: 33.333 },
        { k: "a", v: 66.667 },
        { k: "b", v: 1 },
      ],
      (r) => r.k,
      (r) => r.v,
    )
    expect(Object.fromEntries(out)).toEqual({ a: 100, b: 1 })
  })
})
