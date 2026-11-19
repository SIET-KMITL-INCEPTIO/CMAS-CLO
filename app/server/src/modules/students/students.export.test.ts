import { describe, expect, it } from "vitest"
import { readTable } from "../../lib/excel.js"
import type { StudentRepository } from "./student.repository.js"
import { StudentService } from "./students.service.js"

/** UC 7.4 — GET /courses/:courseId/students/export (ST-IMP-07). No database. */
const repo = {
  courseHeader: async () => ({
    code: "90641001",
    name: "การพัฒนาระบบสารสนเทศ",
    section: 1,
    semester: 1,
    year: 2569,
    instructors: [],
  }),
  rosterForExport: async () => [
    { studentCode: "0660410101", name: "สมชาย ใจดี", status: "ENROLLED" },
    { studentCode: "6604101029", name: "=HYPERLINK(1)", status: "WITHDRAWN" },
  ],
} as unknown as StudentRepository

describe("roster export (UC 7.4)", () => {
  it("lists every student with status, keeps codes as text, and reads back as a roster", async () => {
    const { buffer, fileName } = await new StudentService(repo).exportRoster("c1")
    const table = readTable(buffer)

    expect(table.headers).toEqual(["รหัสนักศึกษา", "ชื่อ-นามสกุล", "สถานะ"])
    expect(table.rows.map((r) => r.cells[0])).toEqual(["0660410101", "6604101029"]) // leading 0 kept
    expect(table.rows.map((r) => r.cells[2])).toEqual(["ปกติ", "ถอนรายวิชา"])
    expect(String(table.rows[1]!.cells[1])).toBe("'=HYPERLINK(1)") // S-7: no formula
    expect(fileName).toMatch(/^roster-90641001-1-\d{12}\.xlsx$/)
    expect(fileName).not.toContain("0660410101")
  })
})
