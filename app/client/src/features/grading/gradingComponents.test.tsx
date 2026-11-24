import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { BandsTable } from "./BandsTable.tsx"
import type { Grading, GradingStudent } from "./grading.types.ts"
import { GradingMethodCard } from "./GradingMethodCard.tsx"
import { GradingNotices } from "./GradingNotices.tsx"
import { StudentGradesTable } from "./StudentGradesTable.tsx"

/** The pieces of the grading page, rendered alone: what they show and which callback each control fires. */
afterEach(cleanup)

const student = (over: Partial<GradingStudent> = {}): GradingStudent => ({
  studentId: "s1",
  studentCode: "001",
  name: "หนึ่ง",
  status: "ENROLLED",
  totalPercent: 85,
  complete: true,
  tScore: null,
  derivedGrade: "A",
  issuedGrade: "A",
  overrideReason: null,
  ...over,
})

const grading = (over: Partial<Grading> = {}): Grading => ({
  gradeScale: "LETTER",
  gradeMethod: "CRITERION_REFERENCED",
  passCriteria: 50,
  passCriteriaSource: "LADDER",
  bands: [
    { grade: "A", minValue: 80, maxValue: 100, count: 3, isPassFloor: false, isFail: false },
    { grade: "D", minValue: 50, maxValue: 80, count: 1, isPassFloor: true, isFail: false },
    { grade: "F", minValue: 0, maxValue: 50, count: 0, isPassFloor: false, isFail: true },
  ],
  frozen: true,
  students: [student()],
  stats: { n: 4, mean: 61.5, sd: 12.25 },
  meta: { warnings: [] },
  ...over,
})

describe("GradingMethodCard", () => {
  it("shows the scale, the pass mark and where it comes from", () => {
    render(<GradingMethodCard g={grading()} />)
    expect(screen.getByText("วิธีตัดเกรด")).toBeTruthy()
    expect(screen.getByText("50%")).toBeTruthy()
    expect(screen.getByText("ตามขั้นบันไดเกรด")).toBeTruthy()
    expect(screen.queryByText("สถิติของกลุ่ม")).toBeNull()
  })

  it("norm-referenced adds the group's n, mean and SD, with a dash for a missing one", () => {
    render(
      <GradingMethodCard
        g={grading({
          gradeMethod: "NORM_REFERENCED",
          passCriteriaSource: "MANUAL",
          stats: { n: 4, mean: 61.5, sd: null },
        })}
      />,
    )
    expect(screen.getByText("สถิติของกลุ่ม")).toBeTruthy()
    expect(screen.getByText("—")).toBeTruthy()
    expect(screen.queryByText("ตามขั้นบันไดเกรด")).toBeNull()
  })
})

describe("BandsTable", () => {
  const props = () => ({
    g: grading(),
    canWrite: true,
    saving: false,
    onNew: vi.fn(),
    onEdit: vi.fn(),
    onRemove: vi.fn(),
  })

  it("lists every band with its count and flags the pass floor and the failing grade", () => {
    render(<BandsTable {...props()} />)
    const rows = screen.getAllByRole("row").slice(1)
    expect(rows).toHaveLength(3)
    expect(within(rows[1]!).getByText("ผ่านขั้นต่ำ")).toBeTruthy()
    expect(within(rows[2]!).getByText("ไม่ผ่าน")).toBeTruthy()
    expect(within(rows[0]!).getByText("3")).toBeTruthy()
  })

  it("edit sends the band's grade and floor; delete is absent on the 0 band", () => {
    const p = props()
    render(<BandsTable {...p} />)
    fireEvent.click(screen.getAllByText("แก้ไข")[0]!)
    expect(p.onEdit).toHaveBeenCalledWith({ grade: "A", minValue: 80 })
    expect(screen.getAllByText("ลบ")).toHaveLength(2)
    fireEvent.click(screen.getAllByText("ลบ")[0]!)
    expect(p.onRemove).toHaveBeenCalledWith(expect.objectContaining({ grade: "A" }))
  })

  it("adding a band calls onNew", () => {
    const p = props()
    render(<BandsTable {...p} />)
    fireEvent.click(screen.getByText("+ ระดับเกรด"))
    expect(p.onNew).toHaveBeenCalledTimes(1)
  })

  it("without write access there are no buttons at all", () => {
    render(<BandsTable {...props()} canWrite={false} />)
    expect(screen.queryByText("แก้ไข")).toBeNull()
    expect(screen.queryByText("ลบ")).toBeNull()
    expect(screen.queryByText("+ ระดับเกรด")).toBeNull()
  })

  it("an S/U ladder cannot add or delete bands, only edit", () => {
    render(<BandsTable {...props()} g={grading({ gradeScale: "PASS_FAIL" })} />)
    expect(screen.queryByText("+ ระดับเกรด")).toBeNull()
    expect(screen.queryByText("ลบ")).toBeNull()
    expect(screen.getAllByText("แก้ไข")).toHaveLength(3)
  })

  it("a delete in flight disables the delete buttons", () => {
    render(<BandsTable {...props()} saving />)
    for (const b of screen.getAllByText("ลบ")) expect((b as HTMLButtonElement).disabled).toBe(true)
  })
})

describe("StudentGradesTable", () => {
  const props = (over: Record<string, unknown> = {}) => ({
    g: grading(),
    rows: [student()],
    sort: "desc" as const,
    canOverride: true,
    onSort: vi.fn(),
    onOverride: vi.fn(),
    ...over,
  })

  it("shows the total, the live grade and the issued one", () => {
    render(<StudentGradesTable {...props()} />)
    expect(screen.getByText("001")).toBeTruthy()
    expect(screen.getByText("85")).toBeTruthy()
    expect(screen.getByText("ผ่าน")).toBeTruthy()
  })

  it("the sort header fires onSort and shows its direction", () => {
    const p = props()
    render(<StudentGradesTable {...p} />)
    expect(screen.getByText("▼")).toBeTruthy()
    fireEvent.click(screen.getByText(/รวม \(%\)/))
    expect(p.onSort).toHaveBeenCalledTimes(1)
  })

  it("an override button appears only for an enrolled student with an issued grade on a frozen course", () => {
    const p = props()
    render(<StudentGradesTable {...p} />)
    fireEvent.click(screen.getByText("ปรับเกรด"))
    expect(p.onOverride).toHaveBeenCalledWith(expect.objectContaining({ studentId: "s1" }))
    cleanup()
    render(<StudentGradesTable {...props({ canOverride: false })} />)
    expect(screen.queryByText("ปรับเกรด")).toBeNull()
    cleanup()
    render(<StudentGradesTable {...props({ g: grading({ frozen: false }) })} />)
    expect(screen.queryByText("ปรับเกรด")).toBeNull()
  })

  it("a withdrawn student reads ถอนรายวิชา and cannot be overridden", () => {
    render(
      <StudentGradesTable
        {...props({
          rows: [student({ status: "WITHDRAWN", derivedGrade: "W", issuedGrade: null })],
        })}
      />,
    )
    expect(screen.getByText("ถอนรายวิชา")).toBeTruthy()
    expect(screen.queryByText("ปรับเกรด")).toBeNull()
  })

  it("an unfinished student waits, a failing one fails", () => {
    render(
      <StudentGradesTable
        {...props({
          rows: [
            student({ studentId: "a", complete: false, derivedGrade: null, issuedGrade: null }),
            student({ studentId: "b", studentCode: "002", derivedGrade: "F", issuedGrade: "F" }),
          ],
        })}
      />,
    )
    expect(screen.getByText("รอประเมิน")).toBeTruthy()
    expect(screen.getByText("ไม่ผ่าน")).toBeTruthy()
  })

  it("flags a frozen grade that today's scores no longer give", () => {
    render(
      <StudentGradesTable
        {...props({ rows: [student({ issuedGrade: "B", derivedGrade: "A" })] })}
      />,
    )
    expect(screen.getByText(/คะแนนเปลี่ยนหลังตรึง · ตอนนี้ได้ A/)).toBeTruthy()
  })

  it("shows the override and its reason, and a T-score column only when norm-referenced", () => {
    render(
      <StudentGradesTable
        {...props({ rows: [student({ overrideReason: "งานชดเชย", tScore: 55.5 })] })}
      />,
    )
    expect(screen.getByText("ปรับแล้ว")).toBeTruthy()
    expect(screen.getByText("งานชดเชย")).toBeTruthy()
    expect(screen.queryByText("T-score")).toBeNull()
    cleanup()
    render(
      <StudentGradesTable
        {...props({
          g: grading({ gradeMethod: "NORM_REFERENCED" }),
          rows: [student({ tScore: 55.5 })],
        })}
      />,
    )
    expect(screen.getByText("T-score")).toBeTruthy()
    expect(screen.getByText("55.5")).toBeTruthy()
  })
})

describe("GradingNotices", () => {
  const props = (over: Record<string, unknown> = {}) => ({
    g: grading(),
    incomplete: 0,
    withdrawn: [] as GradingStudent[],
    note: null,
    canRun: true,
    onUnfreeze: vi.fn(),
    ...over,
  })

  it("says nothing when there is nothing to say", () => {
    const { container } = render(<GradingNotices {...props()} />)
    expect(container.textContent).toBe("")
  })

  it("unfinished scores name the grade they will not be replaced with", () => {
    render(<GradingNotices {...props({ incomplete: 2 })} />)
    expect(screen.getByText(/มี 2 คนที่คะแนนยังไม่ครบ/)).toBeTruthy()
    expect(screen.getByText(/จะไม่แทนด้วย/).textContent).toContain("F")
    cleanup()
    render(
      <GradingNotices {...props({ incomplete: 2, g: grading({ gradeScale: "PASS_FAIL" }) })} />,
    )
    expect(screen.getByText(/จะไม่แทนด้วย/).textContent).toContain("U")
  })

  it("lists server warnings and the withdrawn students", () => {
    render(
      <GradingNotices
        {...props({
          g: grading({ meta: { warnings: ["ตัวอย่างน้อยกว่า 30 คน"] } }),
          withdrawn: [student({ studentCode: "009", name: "เก้า", status: "WITHDRAWN" })],
        })}
      />,
    )
    expect(screen.getByText("ตัวอย่างน้อยกว่า 30 คน")).toBeTruthy()
    expect(screen.getByText(/ถอนรายวิชา 1 คน/).textContent).toContain("009 เก้า")
  })

  it("the freeze note offers to unfreeze only on a frozen course the user may run", () => {
    const p = props({ note: ["ok", "ตรึงเกรดแล้ว 1 คน"] })
    render(<GradingNotices {...p} />)
    fireEvent.click(screen.getByText("ยกเลิกการตรึงเกรด"))
    expect(p.onUnfreeze).toHaveBeenCalledTimes(1)
    cleanup()
    render(<GradingNotices {...props({ note: ["ok", "x"], canRun: false })} />)
    expect(screen.queryByText("ยกเลิกการตรึงเกรด")).toBeNull()
    cleanup()
    render(<GradingNotices {...props({ note: ["info", "x"], g: grading({ frozen: false }) })} />)
    expect(screen.queryByText("ยกเลิกการตรึงเกรด")).toBeNull()
  })
})
