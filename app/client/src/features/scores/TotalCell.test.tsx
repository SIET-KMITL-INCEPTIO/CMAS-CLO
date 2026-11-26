import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import type { ClassResultRow } from "../dashboard/dashboard.types.ts"
import { TotalCell } from "./TotalCell.tsx"

/** #33 · "รวม (%)": the server's total as is — final ones coloured, unfinished ones say how much they rest on. */
afterEach(cleanup)

const row = (over: Partial<ClassResultRow>): ClassResultRow => ({
  studentId: "s1",
  studentCode: "001",
  name: "หนึ่ง",
  clos: [],
  totalScore: 72.5,
  complete: true,
  coursePassed: true,
  assessedWeight: 100,
  ...over,
})
const show = (r: ClassResultRow | undefined) =>
  render(<TotalCell row={r} passCriteria={50} />).container

describe("TotalCell", () => {
  it("a final, passing total: the number in the pass colour, nothing else", () => {
    const c = show(row({}))
    expect(screen.getByText("72.5").className).toContain("text-ok")
    expect(c.textContent).toBe("72.5")
  })

  it("a final, failing total: orange within 10 points of the pass mark, red further", () => {
    show(row({ totalScore: 41, coursePassed: false }))
    expect(screen.getByText("41").className).toContain("text-warn")
    cleanup()
    show(row({ totalScore: 39.99, coursePassed: false }))
    expect(screen.getByText("39.99").className).toContain("text-bad")
  })

  it("a total that is not final is neither pass nor fail, and says how much is assessed", () => {
    const c = show(row({ totalScore: 20, complete: false, coursePassed: null, assessedWeight: 50 }))
    const n = screen.getByText("20")
    expect(n.className).not.toMatch(/text-ok|text-bad/)
    expect(c.textContent).toContain("ประเมินแล้ว 50%")
  })

  it("no score yet, or no row (withdrawn, still loading), is a dash — never 0", () => {
    expect(show(row({ totalScore: null, complete: false, assessedWeight: 0 })).textContent).toBe(
      "–",
    )
    cleanup()
    expect(show(undefined).textContent).toBe("–")
  })
})
