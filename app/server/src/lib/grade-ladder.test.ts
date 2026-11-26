import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  defaultBands,
  FAILING_GRADES,
  LETTER_GRADES,
  lowestPassingMin,
  takesPassCriteria,
} from "./grade-ladder.js"

/**
 * The ladders must match the prototype's seed courses (index-q.html): c1 is
 * A–F อิงเกณฑ์, c3 A–F อิงกลุ่ม, c2 S/U with pass mark 70. A course created
 * through the API then grades exactly like the same course in the prototype.
 */
const html = readFileSync(
  new URL("../../../../docs/index-q/index-q.html", import.meta.url),
  "utf-8",
)

const seedBands = (courseId: string) =>
  [
    ...html.matchAll(
      new RegExp(`courseId:'${courseId}', grade:'([A-Z+]+)', *minValue:([0-9]+)`, "g"),
    ),
  ].map((m) => ({ grade: m[1]!, minValue: Number(m[2]) }))

describe("grade ladder", () => {
  it("A–F อิงเกณฑ์ is the prototype's c1 ladder", () => {
    expect(seedBands("c1")).toHaveLength(8)
    expect(defaultBands("LETTER", "CRITERION_REFERENCED", 50)).toEqual(seedBands("c1"))
  })

  it("A–F อิงกลุ่ม is the prototype's c3 ladder (T-scores)", () => {
    expect(seedBands("c3")).toHaveLength(8)
    expect(defaultBands("LETTER", "NORM_REFERENCED", 50)).toEqual(seedBands("c3"))
  })

  it("S/U puts the pass mark in the S band itself (CR-06), as the prototype's c2", () => {
    expect(defaultBands("PASS_FAIL", "CRITERION_REFERENCED", 70)).toEqual(seedBands("c2"))
    expect(defaultBands("PASS_FAIL", "NORM_REFERENCED", 62)).toEqual([
      { grade: "S", minValue: 62 },
      { grade: "U", minValue: 0 },
    ])
  })

  it("hands out a copy, so editing one course's ladder never changes the next", () => {
    const a = defaultBands("LETTER", "CRITERION_REFERENCED", 50)
    a[0]!.minValue = 99
    expect(defaultBands("LETTER", "CRITERION_REFERENCED", 50)[0]).toEqual({
      grade: "A",
      minValue: 80,
    })
  })

  it("lists the letters in ladder order and knows which grades fail", () => {
    expect(LETTER_GRADES).toEqual(["A", "B+", "B", "C+", "C", "D+", "D", "F"])
    expect([...FAILING_GRADES].sort()).toEqual(["F", "U"])
  })

  it("derives passCriteria from the lowest passing band (design #16)", () => {
    expect(lowestPassingMin(defaultBands("LETTER", "CRITERION_REFERENCED", 0))).toBe(50)
    expect(lowestPassingMin(defaultBands("LETTER", "NORM_REFERENCED", 0))).toBe(35)
    expect(lowestPassingMin(defaultBands("PASS_FAIL", "CRITERION_REFERENCED", 70))).toBe(70)
    expect(
      lowestPassingMin([
        { grade: "B", minValue: 70 },
        { grade: "D", minValue: 40 },
        { grade: "F", minValue: 0 },
      ]),
    ).toBe(40)
    expect(lowestPassingMin([{ grade: "F", minValue: 0 }])).toBe(0)
    expect(lowestPassingMin([])).toBe(0)
  })

  it("asks for passCriteria only where the ladder cannot imply it", () => {
    expect(takesPassCriteria("LETTER", "CRITERION_REFERENCED")).toBe(false)
    expect(takesPassCriteria("LETTER", "NORM_REFERENCED")).toBe(true)
    expect(takesPassCriteria("PASS_FAIL", "CRITERION_REFERENCED")).toBe(true)
    expect(takesPassCriteria("PASS_FAIL", "NORM_REFERENCED")).toBe(true)
  })
})
