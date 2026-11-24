import { describe, expect, it } from "vitest"
import { SHORTCUTS, typingIn } from "./shortcuts.ts"

describe("keyboard shortcuts", () => {
  it("does not take '?' from someone typing in a field", () => {
    expect(typingIn(document.createElement("input"))).toBe(true)
    expect(typingIn(document.createElement("textarea"))).toBe(true)
    expect(typingIn(document.createElement("select"))).toBe(true)
    expect(typingIn(document.createElement("button"))).toBe(false)
    expect(typingIn(null)).toBe(false)
  })

  it("lists the search and help keys the top bar handles", () => {
    expect(SHORTCUTS.map(([k]) => k)).toEqual(expect.arrayContaining(["Ctrl / ⌘ K", "?", "Esc"]))
  })
})
