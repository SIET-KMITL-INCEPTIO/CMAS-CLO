import { describe, expect, it } from "vitest"
import type { Course } from "./course.types.ts"
import { bucketsOf, creditLabel, currentTerm, deletePhrase } from "./courseView.ts"

const c = (o: Partial<Course>): Course =>
  ({
    id: "x",
    code: "01000001",
    name: "ก",
    section: "01",
    semester: 1,
    year: 2569,
    credits: "3.0",
    lectureHours: "2.0",
    practiceHours: "2.0",
    selfStudyHours: "5.0",
    instructors: [],
    counts: { clos: 0, activities: 0, students: 0 },
    ...o,
  }) as Course

describe("courseView", () => {
  it("prints credits the มคอ way", () => {
    expect(creditLabel(c({}))).toBe("3 (2-2-5)")
  })

  it("builds the delete phrase from the course key", () => {
    expect(deletePhrase(c({ section: "02", semester: 2 }))).toBe("01000001-sec02-2-2569-delete")
  })

  it("groups by term, newest first", () => {
    const list = [
      c({ id: "a", year: 2568, semester: 2 }),
      c({ id: "b", year: 2569, semester: 1 }),
      c({ id: "d", year: 2569, semester: 1, section: "02" }),
    ]
    const b = bucketsOf(list, "term")
    expect(b.map((x) => x.head)).toEqual(["ภาค 1/2569", "ภาค 2/2568"])
    expect(b[0]!.items.map((x) => x.id)).toEqual(["b", "d"])
  })

  it("knows the Thai academic term", () => {
    expect(currentTerm(new Date(2026, 6, 1))).toEqual({ semester: 1, year: 2569 })
    expect(currentTerm(new Date(2026, 10, 15))).toEqual({ semester: 2, year: 2569 })
    expect(currentTerm(new Date(2027, 1, 1))).toEqual({ semester: 2, year: 2569 })
  })
})
