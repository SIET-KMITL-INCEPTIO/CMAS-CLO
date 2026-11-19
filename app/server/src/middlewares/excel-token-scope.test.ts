import { describe, expect, it } from "vitest"
import { CAPABILITIES, type Capability } from "../modules/authorization/capabilities.js"
import { EXCEL_TOKEN_CAPS, excelTokenAllows } from "./access.middleware.js"

const MINE = "course-a"
const OTHER = "course-b"

describe("excelTokenAllows — the add-in token reaches one course's scores and nothing else", () => {
  it("allows reading and writing scores of its own course", () => {
    expect(excelTokenAllows({ cap: "course.view" }, MINE, MINE)).toBe(true)
    expect(excelTokenAllows({ cap: "score.edit" }, MINE, MINE)).toBe(true)
  })

  it("refuses the same capabilities on another course", () => {
    expect(excelTokenAllows({ cap: "course.view" }, MINE, OTHER)).toBe(false)
    expect(excelTokenAllows({ cap: "score.edit" }, MINE, OTHER)).toBe(false)
  })

  it("refuses every other capability, even on its own course", () => {
    const others = (Object.keys(CAPABILITIES) as Capability[]).filter(
      (c) => !EXCEL_TOKEN_CAPS.includes(c),
    )
    expect(others.length).toBeGreaterThan(10)
    for (const cap of others) expect(excelTokenAllows({ cap }, MINE, MINE)).toBe(false)
  })

  it("refuses authenticated routes, so a token cannot approve, list or revoke links", () => {
    expect(excelTokenAllows("authenticated", MINE, null)).toBe(false)
  })

  it("lets public routes through, as for anyone", () => {
    expect(excelTokenAllows("public", MINE, null)).toBe(true)
  })

  it("passes the pre-check (course not resolved yet) only for its own capabilities", () => {
    expect(excelTokenAllows({ cap: "score.edit" }, MINE, null)).toBe(true)
    expect(excelTokenAllows({ cap: "score.import" }, MINE, null)).toBe(false)
  })
})
