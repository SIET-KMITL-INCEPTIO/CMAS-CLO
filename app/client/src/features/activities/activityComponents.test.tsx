import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { Clo } from "../clos/clo.types.ts"
import type { Activity, Criteria, CriteriaMeta } from "./activity.types.ts"
import { ActivityTableRow } from "./ActivityTableRow.tsx"
import { ObjectivePicker } from "./ObjectivePicker.tsx"
import { WeightFooter } from "./WeightFooter.tsx"

/** The pieces of the activities page and form, rendered alone. */
afterEach(cleanup)

const activity = (over: Partial<Activity> = {}): Activity => ({
  id: "a1",
  name: "Quiz 1",
  type: "TEST",
  typeLabel: "",
  assessmentMethod: "EXAM",
  assessmentLabel: "",
  criteriaNote: "",
  weight: 30,
  maxScore: 20,
  passScore: 10,
  passMark: 50,
  order: 0,
  closedAt: null,
  scoredCount: 5,
  studentCount: 30,
  ...over,
})

const meta = (sums: Record<string, number> = { a1: 100 }): CriteriaMeta => ({
  activityWeightSums: sums,
  cloWeights: {},
  unlinkedActivityIds: [],
  unmeasuredObjectiveIds: [],
  objectiveWeightSums: {},
  totalWeight: 100,
  isReadyForDashboard: true,
})

const criteria = (
  cells: Criteria["cells"] = [{ activityId: "a1", objectiveId: "o1", weight: 100 }],
  sums?: Record<string, number>,
): Criteria & { meta: CriteriaMeta } => ({
  objectives: [{ id: "o1", cloId: "c1", label: "1.1", weight: 100 }],
  activities: [{ id: "a1", name: "Quiz 1", weight: 30 }],
  cells,
  meta: meta(sums),
})

function renderRow(over: Record<string, unknown> = {}) {
  const props = {
    a: activity(),
    i: 0,
    count: 3,
    criteria: criteria(),
    write: true,
    byGroup: false,
    reordering: false,
    duplicating: false,
    onMove: vi.fn(),
    onEdit: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
    ...over,
  }
  render(
    <table>
      <tbody>
        <ActivityTableRow {...(props as Parameters<typeof ActivityTableRow>[0])} />
      </tbody>
    </table>,
  )
  return props
}

describe("ActivityTableRow", () => {
  it("shows the name, the scores, the weight and the objective it measures", () => {
    renderRow()
    expect(screen.getByText("Quiz 1")).toBeTruthy()
    expect(screen.getByText("20")).toBeTruthy()
    expect(screen.getByText("50%")).toBeTruthy()
    expect(screen.getByText("30%")).toBeTruthy()
    expect(screen.getByText("1.1 · 100%")).toBeTruthy()
    expect(screen.queryByText(/^รวม /)).toBeNull()
  })

  it("flags links that do not add up to 100", () => {
    renderRow({ criteria: criteria(undefined, { a1: 80 }) })
    expect(screen.getByText("รวม 80%")).toBeTruthy()
  })

  it("an unlinked activity offers to link it (to writers only)", () => {
    const p = renderRow({ criteria: criteria([]) })
    fireEvent.click(screen.getByText("ยังไม่ผูกจุดประสงค์"))
    expect(p.onEdit).toHaveBeenCalledWith(p.a)
    cleanup()
    renderRow({ criteria: criteria([]), write: false })
    expect(screen.queryByText("ยังไม่ผูกจุดประสงค์")).toBeNull()
  })

  it("a zero weight says it is not counted yet; a closed activity says when it closed", () => {
    renderRow({ a: activity({ weight: 0, closedAt: "2026-11-01T08:00:00Z" }) })
    expect(screen.getByText("ยังไม่เข้าการคำนวณ")).toBeTruthy()
    expect(screen.getByText("2026-11-01")).toBeTruthy()
  })

  it("GROUP mode marks the weight as coming from the group", () => {
    renderRow({ byGroup: true })
    expect(screen.getByText("จากกลุ่ม")).toBeTruthy()
  })

  it("the buttons fire their callbacks with this activity", () => {
    const p = renderRow({ i: 1 })
    fireEvent.click(screen.getByLabelText("เลื่อน Quiz 1 ขึ้น"))
    expect(p.onMove).toHaveBeenCalledWith(1, -1)
    fireEvent.click(screen.getByLabelText("เลื่อน Quiz 1 ลง"))
    expect(p.onMove).toHaveBeenCalledWith(1, 1)
    fireEvent.click(screen.getByText("แก้ไข"))
    expect(p.onEdit).toHaveBeenCalledWith(p.a)
    fireEvent.click(screen.getByText("ทำสำเนา"))
    expect(p.onDuplicate).toHaveBeenCalledWith(p.a)
    fireEvent.click(screen.getByText("ลบ"))
    expect(p.onDelete).toHaveBeenCalledWith(p.a)
    expect(screen.getByText("02")).toBeTruthy()
  })

  it("the first row cannot move up and the last cannot move down; a reorder in flight locks both", () => {
    renderRow({ i: 0 })
    expect((screen.getByLabelText("เลื่อน Quiz 1 ขึ้น") as HTMLButtonElement).disabled).toBe(true)
    cleanup()
    renderRow({ i: 2 })
    expect((screen.getByLabelText("เลื่อน Quiz 1 ลง") as HTMLButtonElement).disabled).toBe(true)
    cleanup()
    renderRow({ i: 1, reordering: true })
    expect((screen.getByLabelText("เลื่อน Quiz 1 ขึ้น") as HTMLButtonElement).disabled).toBe(true)
  })

  it("a duplicate in flight disables the copy button", () => {
    renderRow({ duplicating: true })
    expect((screen.getByText("ทำสำเนา") as HTMLButtonElement).disabled).toBe(true)
  })

  it("without write access there are no controls", () => {
    renderRow({ write: false })
    for (const label of ["แก้ไข", "ทำสำเนา", "ลบ"]) expect(screen.queryByText(label)).toBeNull()
    expect(screen.queryByLabelText("เลื่อน Quiz 1 ขึ้น")).toBeNull()
  })
})

describe("ObjectivePicker", () => {
  const clo = { id: "c1", number: 1 } as Clo
  const objs = [
    { id: "o1", cloId: "c1", label: "1.1", weight: 50 },
    { id: "o2", cloId: "c1", label: "1.2", weight: 50 },
  ]
  const props = (over: Record<string, unknown> = {}) => ({
    groups: [{ clo, objs }],
    ticked: { o1: "100" } as Record<string, string>,
    objectiveText: new Map([["o1", "อธิบายแนวคิด"]]),
    error: undefined as string | undefined,
    onToggle: vi.fn(),
    onShare: vi.fn(),
    ...over,
  })

  it("lists each objective under its CLO, with a share box only for the ticked ones", () => {
    render(<ObjectivePicker {...props()} />)
    expect(screen.getByText("CLO 1")).toBeTruthy()
    expect(screen.getByText("อธิบายแนวคิด")).toBeTruthy()
    expect(screen.getAllByRole("checkbox")).toHaveLength(2)
    expect(screen.getAllByRole("textbox")).toHaveLength(1)
    expect((screen.getByLabelText("สัดส่วนของ 1.1 (%)") as HTMLInputElement).value).toBe("100")
  })

  it("ticking and typing a share call back with the objective's id", () => {
    const p = props()
    render(<ObjectivePicker {...p} />)
    fireEvent.click(screen.getAllByRole("checkbox")[1]!)
    expect(p.onToggle).toHaveBeenCalledWith("o2")
    fireEvent.change(screen.getByLabelText("สัดส่วนของ 1.1 (%)"), { target: { value: "60" } })
    expect(p.onShare).toHaveBeenCalledWith("o1", "60")
  })

  it("the total is green with a tick at 100 and says what is missing otherwise", () => {
    render(<ObjectivePicker {...props()} />)
    expect(screen.getByText(/รวม 100%/).textContent).toContain("✓")
    cleanup()
    render(<ObjectivePicker {...props({ ticked: { o1: "30", o2: "40" } })} />)
    expect(screen.getByText(/รวม 70%/).textContent).toContain("ต้องรวมได้ 100%")
  })

  it("shows the error under the picker", () => {
    render(<ObjectivePicker {...props({ error: "เลือกจุดประสงค์อย่างน้อย 1 ข้อ" })} />)
    expect(screen.getByText("เลือกจุดประสงค์อย่างน้อย 1 ข้อ")).toBeTruthy()
  })
})

describe("WeightFooter", () => {
  const props = (over: Record<string, unknown> = {}) => ({
    total: 100,
    byGroup: false,
    write: true,
    pending: false,
    onSwitch: vi.fn(),
    ...over,
  })

  it("says the weights are complete at 100%, and what to do when they are not", () => {
    render(<WeightFooter {...props()} />)
    expect(screen.getByText(/ครบแล้ว/)).toBeTruthy()
    cleanup()
    render(<WeightFooter {...props({ total: 80 })} />)
    expect(screen.getByText(/ต้องเท่ากับ 100%/)).toBeTruthy()
    expect(screen.getByText("80%")).toBeTruthy()
  })

  it("the mode buttons switch, and the current one is marked", () => {
    const p = props()
    render(<WeightFooter {...p} />)
    const group = screen.getByText("ต่อกลุ่มประเภท")
    const each = screen.getByText("ทีละกิจกรรม")
    expect(each.getAttribute("aria-current")).toBe("true")
    expect(group.getAttribute("aria-current")).toBeNull()
    fireEvent.click(group)
    expect(p.onSwitch).toHaveBeenCalledWith("GROUP")
    fireEvent.click(each)
    expect(p.onSwitch).toHaveBeenCalledWith("MANUAL")
  })

  it("GROUP mode marks the other button; a save in flight disables both; readers see no switch", () => {
    render(<WeightFooter {...props({ byGroup: true, pending: true })} />)
    expect(screen.getByText("ต่อกลุ่มประเภท").getAttribute("aria-current")).toBe("true")
    expect((screen.getByText("ทีละกิจกรรม") as HTMLButtonElement).disabled).toBe(true)
    cleanup()
    const { container } = render(<WeightFooter {...props({ write: false })} />)
    expect(within(container).queryByText("ต่อกลุ่มประเภท")).toBeNull()
  })
})
