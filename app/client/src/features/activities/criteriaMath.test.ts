import { describe, expect, it } from "vitest"
import type { Cell } from "./activity.types.ts"
import { cloShare, evenRow, setCloShare, splitCents } from "./criteriaMath.ts"

const objectives = [
  { id: "o11", cloId: "c1", label: "1.1", weight: 40 },
  { id: "o12", cloId: "c1", label: "1.2", weight: 60 },
  { id: "o21", cloId: "c2", label: "2.1", weight: 100 },
]

describe("splitCents", () => {
  it("shares a total by weight to two decimals, summing exactly", () => {
    expect(splitCents([1, 1, 1], 100)).toEqual([33.34, 33.33, 33.33])
    expect(splitCents([40, 60], 50)).toEqual([20, 30])
    expect(splitCents([0, 0], 100)).toEqual([0, 0])
  })
})

describe("matrix cells per CLO (Q7)", () => {
  const cells: Cell[] = [
    { activityId: "a", objectiveId: "o11", weight: 20 },
    { activityId: "a", objectiveId: "o12", weight: 30 },
  ]

  it("reads a CLO cell as the sum over its objectives", () => {
    expect(cloShare(cells, objectives, "a", "c1")).toBe(50)
    expect(cloShare(cells, objectives, "a", "c2")).toBeNull()
  })

  it("keeps the existing split when the total is edited", () => {
    const next = setCloShare(cells, objectives, "a", "c1", 100)
    expect(next.filter((c) => c.activityId === "a")).toEqual([
      { activityId: "a", objectiveId: "o11", weight: 40 },
      { activityId: "a", objectiveId: "o12", weight: 60 },
    ])
  })

  it("splits a first link by the objectives' own weights", () => {
    const next = setCloShare([], objectives, "a", "c1", 50)
    expect(next).toEqual([
      { activityId: "a", objectiveId: "o11", weight: 20 },
      { activityId: "a", objectiveId: "o12", weight: 30 },
    ])
  })

  it("clearing a cell unlinks the activity from every objective of the CLO, others untouched", () => {
    const all: Cell[] = [
      ...cells,
      { activityId: "a", objectiveId: "o21", weight: 50 },
      { activityId: "b", objectiveId: "o11", weight: 100 },
    ]
    const next = setCloShare(all, objectives, "a", "c1", null)
    expect(next).toEqual([
      { activityId: "a", objectiveId: "o21", weight: 50 },
      { activityId: "b", objectiveId: "o11", weight: 100 },
    ])
  })

  it("evens a row over the CLOs it touches", () => {
    const all: Cell[] = [...cells, { activityId: "a", objectiveId: "o21", weight: 10 }]
    const next = evenRow(all, objectives, "a")
    expect(cloShare(next, objectives, "a", "c1")).toBe(50)
    expect(cloShare(next, objectives, "a", "c2")).toBe(50)
  })
})
