import { describe, expect, it } from "vitest"
import { formatUserCode } from "./useExcel.ts"

describe("formatUserCode", () => {
  it("shows the code as Excel does, whatever was typed", () => {
    expect(formatUserCode("abcd2345")).toBe("ABCD-2345")
    expect(formatUserCode("ABCD 2345")).toBe("ABCD-2345")
    expect(formatUserCode("abc")).toBe("ABC")
  })

  it("drops characters the server never issues and stops at 8", () => {
    expect(formatUserCode("A0B1C-IDO2345XYZ")).toBe("ABCD-2345")
  })
})
