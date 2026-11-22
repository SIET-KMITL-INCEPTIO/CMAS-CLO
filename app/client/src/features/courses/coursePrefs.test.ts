import { afterEach, describe, expect, it, vi } from "vitest"
import { PREF, readPref, writePref } from "./coursePrefs.ts"

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe("readPref", () => {
  it("starts grouped by term, as cards", () => {
    expect(readPref()).toEqual({ group: "term", view: "card" })
  })

  it("returns what was written", () => {
    writePref({ group: "term", view: "table" })
    expect(readPref()).toEqual({ group: "term", view: "table" })
    expect(JSON.parse(localStorage.getItem(PREF)!)).toEqual({ group: "term", view: "table" })
  })

  it("falls back, field by field, on a value it does not know", () => {
    localStorage.setItem(PREF, JSON.stringify({ group: "nonsense", view: "table" }))
    expect(readPref()).toEqual({ group: "term", view: "table" })
    localStorage.setItem(PREF, JSON.stringify({ group: "term", view: "grid" }))
    expect(readPref().view).toBe("card")
  })

  it("survives stored text that is not JSON", () => {
    localStorage.setItem(PREF, "{broken")
    expect(readPref()).toEqual({ group: "term", view: "card" })
  })

  it("survives storage that throws (a private window)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    expect(readPref()).toEqual({ group: "term", view: "card" })
  })
})

describe("writePref", () => {
  it("does not throw when storage refuses", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota")
    })
    expect(() => writePref({ group: "term", view: "card" })).not.toThrow()
  })
})
