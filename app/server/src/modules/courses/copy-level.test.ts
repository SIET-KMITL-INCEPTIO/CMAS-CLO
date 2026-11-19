import { describe, expect, it } from "vitest"
import type { CourseRepository } from "./course.repository.js"
import { CourseService } from "./courses.service.js"
import { copyLevelCommitSchema, copyLevelSchema } from "./courses.validator.js"

/** UC 2.9 preview (ST-COURSE-07): which courses a year-level copy would take. No database. */
const ACTIVE = { role: "INSTRUCTOR", isActive: true, status: "ACTIVE" }
const pool = [
  // year 1, term 1 in the plan, name as in the plan
  {
    id: "a",
    code: "03376120",
    name: "ระบบฐานข้อมูล",
    semester: 1,
    section: "01",
    year: 2568,
    instructors: [{ userId: "t1" }],
  },
  // year 1 in the plan, but opened in term 2 and renamed
  {
    id: "b",
    code: "03376116",
    name: "ซอฟต์แวร์เบื้องต้น",
    semester: 2,
    section: "01",
    year: 2568,
    instructors: [{ userId: "t1" }, { userId: "gone" }],
  },
  // not in the plan, term 1: an elective
  {
    id: "c",
    code: "90649999",
    name: "วิชาเลือก",
    semester: 1,
    section: "01",
    year: 2568,
    instructors: [{ userId: "t1" }],
  },
  // year 3 in the plan: not this level
  {
    id: "d",
    code: "03376132",
    name: "ปัญญาประดิษฐ์เพื่องานด้านการศึกษา",
    semester: 1,
    section: "01",
    year: 2568,
    instructors: [{ userId: "t1" }],
  },
]
const repo = {
  visibleTo: () => ({}),
  yearPool: async () => pool,
  keysInYear: async () => new Set(["03376120|1|01"]),
  findUsers: async (ids: string[]) =>
    ids.map((id) => (id === "gone" ? { id, ...ACTIVE, isActive: false } : { id, ...ACTIVE })),
} as unknown as CourseRepository

const caller = { userId: "t1", role: "INSTRUCTOR" as const }

describe("copy-level preview (UC 2.9)", () => {
  it("splits the source year into planned, off-plan and missing, with a note per problem", async () => {
    const out = await new CourseService(repo).copyLevelPreview(
      { level: 1, fromYear: 2568, toYear: 2569 },
      caller,
    )
    expect(out.planned.map((r) => r.courseId)).toEqual(["a", "b"])
    expect(out.offPlan.map((r) => r.courseId)).toEqual(["c"])
    expect(out.missing.some((m) => m.code === "03376120")).toBe(false) // opened, so not missing
    expect(out.missing).toHaveLength(14) // 16 year-1 courses in the plan, 2 opened

    const [a, b] = out.planned
    expect(a!.exists).toBe(true)
    expect(a!.notes[0]!.tone).toBe("nil")
    expect(b!.exists).toBe(false)
    expect(b!.notes.map((n) => n.text).join(" ")).toMatch(/แผนการเรียนกำหนดภาค 1/)
    expect(b!.notes.map((n) => n.text).join(" ")).toMatch(/ชื่อไม่ตรงหลักสูตร/)
    expect(b!.notes.map((n) => n.text).join(" ")).toMatch(/1 คนไม่ถูกคัดลอก/)
  })

  it("accepts a later year only, and 1 to 100 courses on commit", () => {
    expect(() => copyLevelSchema.parse({ level: 1, fromYear: 2569, toYear: 2569 })).toThrow()
    expect(() => copyLevelSchema.parse({ level: 5, fromYear: 2568, toYear: 2569 })).toThrow()
    expect(() =>
      copyLevelCommitSchema.parse({ level: 1, fromYear: 2568, toYear: 2569, courseIds: [] }),
    ).toThrow()
  })
})
