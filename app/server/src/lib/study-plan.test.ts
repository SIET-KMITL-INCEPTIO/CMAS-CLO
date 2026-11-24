import { describe, expect, it } from "vitest"
import { STUDY_PLAN, studyPlanOf, termTh } from "./study-plan.js"

describe("study plan (UC 2.9, หลักสูตร ค.อ.บ. เทคโนโลยีคอมพิวเตอร์ ปรับปรุง 2567)", () => {
  it("holds the 40 courses of the plan, one row per code", () => {
    expect(STUDY_PLAN).toHaveLength(40)
    expect(new Set(STUDY_PLAN.map((p) => p.code)).size).toBe(40)
    expect(STUDY_PLAN.filter((p) => p.level === 1)).toHaveLength(16)
  })

  it("finds a course by code and answers null for an elective", () => {
    expect(studyPlanOf("03376120")).toMatchObject({ level: 1, semester: 1, name: "ระบบฐานข้อมูล" })
    expect(studyPlanOf("90649999")).toBeNull()
  })

  it("names the special term", () => {
    expect(termTh(1)).toBe("ภาค 1")
    expect(termTh(3)).toBe("ภาคพิเศษ")
  })
})
