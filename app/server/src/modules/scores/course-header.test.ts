import { describe, expect, it } from "vitest"
import { courseHeader } from "./scores.service.js"

const row = {
  code: "90641001",
  name: "วิชา",
  nameEn: null,
  section: "01",
  semester: 2,
  year: 2569,
  credits: { toString: () => "3.0" },
  lectureHours: { toString: () => "2.0" },
  practiceHours: { toString: () => "2.0" },
  selfStudyHours: { toString: () => "5.0" },
  instructors: [{ user: { name: "ข" } }, { user: { name: "ก" } }],
}

describe("courseHeader (the header of the Excel score form)", () => {
  it("prints credits the way the faculty does, without the trailing .0", () => {
    expect(courseHeader(row).credits).toBe("3 (2-2-5)")
  })

  it("keeps a real fraction and a real zero", () => {
    const c = courseHeader({
      ...row,
      credits: { toString: () => "0.0" },
      lectureHours: { toString: () => "0.0" },
      practiceHours: { toString: () => "0.0" },
      selfStudyHours: { toString: () => "1.5" },
    })
    expect(c.credits).toBe("0 (0-0-1.5)")
  })

  it("lists instructors in Thai order and names no institution", () => {
    const c = courseHeader(row)
    expect(c.instructors).toEqual(["ก", "ข"])
    expect(Object.keys(c)).toEqual([
      "code",
      "name",
      "nameEn",
      "section",
      "semester",
      "year",
      "credits",
      "instructors",
    ])
  })
})
