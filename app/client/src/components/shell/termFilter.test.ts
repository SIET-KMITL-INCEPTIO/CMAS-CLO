import { beforeEach, describe, expect, it, vi } from "vitest"
import { ALL, effectiveTerm, inTerm, termKey, termLabel, termsOf } from "./termFilter.ts"

const c = (semester: number, year: number) => ({ semester, year })

describe("term helpers", () => {
  it("lists each term once, newest first", () => {
    const terms = termsOf([c(2, 2569), c(1, 2570), c(1, 2569), c(1, 2570), c(3, 2569)])
    expect(terms).toEqual(["2570-1", "2569-3", "2569-2", "2569-1"])
  })

  it("labels a term the way the list pane groups it", () => {
    expect(termLabel(termKey(c(1, 2570)))).toBe("ภาค 1/2570")
  })

  it("shows every term when the saved one is not among the caller's", () => {
    expect(effectiveTerm("2570-1", ["2570-1", "2569-2"])).toBe("2570-1")
    expect(effectiveTerm("2568-1", ["2570-1"])).toBe(ALL)
    expect(effectiveTerm(ALL, ["2570-1"])).toBe(ALL)
  })

  it("keeps only the chosen term's courses, or all of them", () => {
    const rows = [c(1, 2570), c(2, 2569)]
    expect(rows.filter(inTerm("2569-2"))).toEqual([c(2, 2569)])
    expect(rows.filter(inTerm(ALL))).toEqual(rows)
  })
})

describe("saved term", () => {
  // termFilter.ts reads localStorage once, when it is first imported.
  async function fresh(saved?: string) {
    vi.resetModules()
    localStorage.clear()
    if (saved !== undefined) localStorage.setItem("cmas-term", saved)
    return (await import("./termFilter.ts")).useTermFilter
  }
  beforeEach(() => localStorage.clear())

  it("starts at every term", async () => {
    expect((await fresh()).getState().term).toBe(ALL)
  })

  it("survives a reload", async () => {
    const store = await fresh()
    store.getState().setTerm("2570-1")
    expect(localStorage.getItem("cmas-term")).toBe("2570-1")
    expect((await fresh("2570-1")).getState().term).toBe("2570-1")
  })
})
