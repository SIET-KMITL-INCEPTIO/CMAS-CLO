import { describe, expect, it } from "vitest"
import type { CourseWithReadiness } from "./course.types.ts"
import { bucketNote } from "./courseListParts.tsx"

const course = (students: number, blockers: string[]) =>
  ({ counts: { students }, readiness: { blockers } }) as unknown as CourseWithReadiness

describe("bucketNote", () => {
  it("counts courses, students and the courses with nothing left to set up", () => {
    const items = [course(30, []), course(12, ["ยังไม่มี CLO"]), course(8, [])]
    expect(bucketNote({ key: "k", head: "h", sample: items[0]!, items })).toBe(
      "3 รายวิชา · 50 นักศึกษา · พร้อมใช้งาน 2/3",
    )
  })
})
