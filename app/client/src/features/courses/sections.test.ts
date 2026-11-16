import { describe, expect, it } from "vitest"
import type { Course } from "./course.types.ts"
import { COURSE_SECTIONS, GROUP_LABEL, SETUP_STEPS, courseLabel } from "./sections.ts"

const counts = { clos: 4, activities: 7, students: 35 }

describe("sections", () => {
  it("has one unique id and path per course page", () => {
    const ids = COURSE_SECTIONS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    const paths = COURSE_SECTIONS.map((s) => s.path)
    expect(new Set(paths).size).toBe(paths.length)
    expect(COURSE_SECTIONS[0]).toMatchObject({ id: "overview", path: "", group: "top" })
  })

  it("counts come from the course", () => {
    const course = { counts } as Course
    const byId = Object.fromEntries(COURSE_SECTIONS.map((s) => [s.id, s.count?.(course)]))
    expect(byId).toMatchObject({ clos: 4, activities: 7, roster: 35, overview: undefined })
  })

  it("every setup and result section has a group label", () => {
    for (const s of COURSE_SECTIONS)
      if (s.group !== "top") expect(GROUP_LABEL[s.group]).toBeTruthy()
  })

  it("every setup step with a home points at a real course page", () => {
    const paths = new Set(COURSE_SECTIONS.map((s) => s.path))
    expect(SETUP_STEPS).toHaveLength(6)
    for (const step of SETUP_STEPS) if (step.path !== null) expect(paths.has(step.path)).toBe(true)
    // The activities page is home to two steps: its list and its matrix.
    expect(SETUP_STEPS.filter((s) => s.path === "activities").map((s) => s.view)).toEqual([
      "list",
      "matrix",
    ])
  })

  it("labels a course by code, section and term", () => {
    expect(courseLabel({ code: "90641003", section: "01", semester: 2, year: 2569 })).toBe(
      "90641003 · Sec 01 · ภาค 2/2569",
    )
  })
})
