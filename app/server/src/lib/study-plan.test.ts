import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { STUDY_PLAN, studyPlanOf, termTh } from "./study-plan.js"

/**
 * The prototype's STUDY_PLAN is the spec (same rows, same order). Reading it
 * out of docs/index-q/index-q.html makes every code and name count: a typo in
 * either copy fails here, not in a teacher's "copy year 1" dialog.
 */
const html = readFileSync(
  new URL("../../../../docs/index-q/index-q.html", import.meta.url),
  "utf-8",
)

function prototypePlan() {
  const start = html.indexOf("const STUDY_PLAN = [")
  const block = html.slice(start, html.indexOf("];", start))
  return [...block.matchAll(/\[(\d),(\d),'(\d{8})','([^']+)'\]/g)].map((m) => ({
    level: Number(m[1]),
    semester: Number(m[2]),
    code: m[3]!,
    name: m[4]!,
  }))
}

describe("study plan (UC 2.9, หลักสูตร ค.อ.บ. เทคโนโลยีคอมพิวเตอร์ ปรับปรุง 2567)", () => {
  it("is the prototype's STUDY_PLAN row for row", () => {
    const proto = prototypePlan()
    expect(proto).toHaveLength(40)
    expect(STUDY_PLAN).toEqual(proto)
  })

  it("holds the 40 courses of the plan, one row per code", () => {
    expect(STUDY_PLAN).toHaveLength(40)
    expect(new Set(STUDY_PLAN.map((p) => p.code)).size).toBe(40)
    expect(STUDY_PLAN.filter((p) => p.level === 1)).toHaveLength(16)
  })

  it("finds a course by code and answers null for an elective", () => {
    expect(studyPlanOf("03376120")).toEqual({
      level: 1,
      semester: 1,
      code: "03376120",
      name: "ระบบฐานข้อมูล",
    })
    expect(studyPlanOf("90649999")).toBeNull()
  })

  it("names the special term", () => {
    expect(termTh(1)).toBe("ภาค 1")
    expect(termTh(2)).toBe("ภาค 2")
    expect(termTh(3)).toBe("ภาคพิเศษ")
  })
})
