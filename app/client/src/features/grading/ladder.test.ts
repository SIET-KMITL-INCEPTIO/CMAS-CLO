import { describe, expect, it } from "vitest"
import { checkBands, defaultBands, rangeText, withBand } from "./ladder.ts"

describe("ladder", () => {
  it("starts from the same ladders as a new course", () => {
    expect(defaultBands("LETTER", "CRITERION_REFERENCED", 50).map((b) => b.minValue)).toEqual([
      80, 75, 70, 65, 60, 55, 50, 0,
    ])
    expect(defaultBands("LETTER", "NORM_REFERENCED", 50)[0]).toEqual({ grade: "A", minValue: 65 })
    expect(defaultBands("PASS_FAIL", "CRITERION_REFERENCED", 70)).toEqual([
      { grade: "S", minValue: 70 },
      { grade: "U", minValue: 0 },
    ])
  })

  it("refuses a repeated name or start, a missing 0, and a percent above 100", () => {
    const ok = [
      { grade: "A", minValue: 50 },
      { grade: "F", minValue: 0 },
    ]
    expect(checkBands(ok, "CRITERION_REFERENCED")).toBeNull()
    expect(checkBands([...ok, { grade: "A", minValue: 10 }], "CRITERION_REFERENCED")).toBe(
      "ชื่อเกรดซ้ำกัน",
    )
    expect(checkBands([...ok, { grade: "B", minValue: 50 }], "CRITERION_REFERENCED")).toBe(
      "คะแนนเริ่มของเกรดซ้ำกัน",
    )
    expect(checkBands([{ grade: "A", minValue: 50 }], "CRITERION_REFERENCED")).toBe(
      "ต้องมีเกรดที่เริ่มที่ 0",
    )
    expect(
      checkBands(
        [
          { grade: "A", minValue: 120 },
          { grade: "F", minValue: 0 },
        ],
        "CRITERION_REFERENCED",
      ),
    ).toMatch(/ไม่เกิน 100/)
    expect(
      checkBands(
        [
          { grade: "A", minValue: 120 },
          { grade: "F", minValue: 0 },
        ],
        "NORM_REFERENCED",
      ),
    ).toBeNull()
  })

  it("adds, renames and removes a band, highest first", () => {
    const bands = defaultBands("LETTER", "CRITERION_REFERENCED", 50)
    expect(withBand(bands, null, { grade: "A+", minValue: 90 })[0]).toEqual({
      grade: "A+",
      minValue: 90,
    })
    expect(withBand(bands, "B", { grade: "B", minValue: 72 }).map((b) => b.minValue)).toEqual([
      80, 75, 72, 65, 60, 55, 50, 0,
    ])
    expect(withBand(bands, "F", null)).toHaveLength(7)
  })

  it("never shows a number in two bands", () => {
    expect(rangeText({ minValue: 80, maxValue: 100 }, 0, false)).toBe("80.00 – 100.00")
    expect(rangeText({ minValue: 75, maxValue: 80 }, 1, false)).toBe("75.00 – 79.99")
    expect(rangeText({ minValue: 65, maxValue: null }, 0, true)).toBe("ตั้งแต่ 65.00")
  })
})
