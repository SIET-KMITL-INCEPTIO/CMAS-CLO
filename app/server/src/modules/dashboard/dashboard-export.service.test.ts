/**
 * Characterization tests (refactor-plan.md P0) for the Excel exports, which P3 moved
 * from DashboardService to DashboardExportService: same files, same sheets, same numbers.
 */
import * as XLSX from "xlsx"
import { describe, expect, it } from "vitest"
import { setup } from "./dashboard.fixtures.js"

const sheetsOf = (buf: Buffer) => XLSX.read(buf, { type: "buffer" })
const rowsOf = (wb: XLSX.WorkBook, name: string) =>
  XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name]!, { header: 1, defval: null })

describe("exports", () => {
  it("scores: raw, clo or both sheets, named after the course", async () => {
    const { exports: service } = setup()
    const raw = await service.scoresExport("k1", "raw")
    expect(raw.fileName).toMatch(/^scores-90641001-01-\d{12}\.xlsx$/)
    expect(sheetsOf(raw.buffer).SheetNames).toEqual(["คะแนนดิบ"])
    expect(sheetsOf((await service.scoresExport("k1", "clo")).buffer).SheetNames).toEqual([
      "คะแนนราย CLO",
    ])
    expect(sheetsOf((await service.scoresExport("k1", "both")).buffer).SheetNames).toEqual([
      "คะแนนดิบ",
      "คะแนนราย CLO",
    ])
  })

  it("scores raw sheet: one row per student including the withdrawn, marked ถอน", async () => {
    const { exports: service } = setup()
    const wb = sheetsOf((await service.scoresExport("k1", "raw")).buffer)
    const rows = rowsOf(wb, "คะแนนดิบ").filter((r) => r.includes("006"))
    expect(rows).toHaveLength(1)
    expect(rows[0]).toContain("ถอน")
  })

  it("grades: summary, need-help and grade sheets; live grades before anything is issued", async () => {
    const { exports: service } = setup()
    const out = await service.gradesExport("k1")
    expect(out.fileName).toMatch(/^grades-90641001-01-\d{12}\.xlsx$/)
    const wb = sheetsOf(out.buffer)
    expect(wb.SheetNames).toEqual(["สรุปราย CLO", "ยังไม่ผ่านราย CLO", "เกรด"])
    const grades = rowsOf(wb, "เกรด")
    const gradeOf = (code: string) => grades.find((r) => r.includes(code))?.[3]
    expect(gradeOf("001")).toBe("A")
    expect(gradeOf("003")).toBe("ยังประเมินไม่ครบ")
    expect(gradeOf("006")).toBe("W")
    const help = rowsOf(wb, "ยังไม่ผ่านราย CLO")
    expect(help.find((r) => r.includes("002"))).toContain("ทำแบบฝึกเพิ่ม")
  })

  it("dashboard: the course scope has summary, CLO and need-help sheets", async () => {
    const { exports: service } = setup()
    const out = await service.dashboardExport("k1", "course")
    expect(out.fileName).toMatch(/^dashboard-90641001-01-\d{12}\.xlsx$/)
    expect(sheetsOf(out.buffer).SheetNames).toEqual([
      "สรุปราย CLO",
      "คะแนนราย CLO",
      "ยังไม่ผ่านราย CLO",
    ])
  })

  it("dashboard: the student scope is one sheet for that student", async () => {
    const { exports: service } = setup()
    const out = await service.dashboardExport("k1", "student", "s2")
    expect(out.fileName).toMatch(/^student-002-\d{12}\.xlsx$/)
    const wb = sheetsOf(out.buffer)
    expect(wb.SheetNames).toEqual(["รายบุคคล"])
    const clo2 = rowsOf(wb, "รายบุคคล").find((r) => r.includes("CLO 2"))
    expect(clo2).toContain("ทำแบบฝึกเพิ่ม")
    expect(clo2).toContain("ยังไม่ผ่าน")
  })
})
