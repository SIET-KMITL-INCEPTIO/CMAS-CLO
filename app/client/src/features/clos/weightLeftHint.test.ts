import { describe, expect, it } from "vitest"
import { weightLeftHint } from "./useClos.ts"

/** The one line under a weight field: each number once, the total only when it needs fixing. */
describe("weightLeftHint", () => {
  it("says what is left", () => {
    expect(weightLeftHint(0)).toBe("เหลือ 100%")
    expect(weightLeftHint(66.667)).toBe("เหลือ 33.33%")
  })

  it("says it is full at 100", () => {
    expect(weightLeftHint(100)).toBe("ครบ 100% แล้ว")
    expect(weightLeftHint(99.999)).toBe("ครบ 100% แล้ว")
  })

  it("names the total only when the others are over 100", () => {
    expect(weightLeftHint(110)).toBe("ข้ออื่นรวม 110% — เกิน 100%")
  })
})
