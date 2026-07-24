import { describe, expect, it } from "vitest"
import { cn } from "./utils"

describe("cn", () => {
  it("joins plain class names", () => {
    expect(cn("flex", "items-center")).toBe("flex items-center")
  })

  it("drops falsy values from conditional classes", () => {
    const isAtRisk = false
    expect(cn("border", isAtRisk && "border-red-300", undefined, null)).toBe("border")
  })

  it("keeps the last of two conflicting Tailwind utilities", () => {
    // This is the whole reason cn() wraps twMerge rather than just clsx:
    // plain concatenation would emit both and let CSS order decide.
    expect(cn("p-2", "p-4")).toBe("p-4")
    expect(cn("text-green-800", "text-red-800")).toBe("text-red-800")
  })

  it("does not merge utilities from different property groups", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4")
  })

  it("supports the array and object forms clsx accepts", () => {
    expect(cn(["flex", "gap-2"], { "bg-red-50": true, "bg-blue-50": false })).toBe(
      "flex gap-2 bg-red-50",
    )
  })

  it("returns an empty string when given nothing", () => {
    expect(cn()).toBe("")
  })
})
