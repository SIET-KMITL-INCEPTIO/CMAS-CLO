import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { AtRiskRow, Attainment } from "../dashboard/dashboard.types.ts"
import { CloAttainmentCard } from "./CloAttainmentCard.tsx"
import type { CourseWithReadiness } from "./course.types.ts"
import { CourseListBody } from "./CourseListBody.tsx"
import { bucketsOf } from "./courseView.ts"
import { FollowUpTable } from "./FollowUpTable.tsx"

/** The pieces of the course list and overview, rendered alone. */
vi.mock("../../hooks/useCan.ts", () => ({ useCan: () => () => true }))
afterEach(cleanup)

const inRouter = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>)

const course = (over: Partial<CourseWithReadiness> = {}): CourseWithReadiness => ({
  id: "k1",
  code: "03376120",
  name: "ระบบฐานข้อมูล",
  nameEn: null,
  semester: 1,
  year: 2568,
  section: "01",
  credits: "3.0",
  lectureHours: "2.0",
  practiceHours: "2.0",
  selfStudyHours: "5.0",
  gradeScale: "LETTER",
  gradeMethod: "CRITERION_REFERENCED",
  weightMode: "MANUAL",
  passCriteria: 50,
  cloPassMark: 60,
  classTarget: 60,
  createdAt: "",
  updatedAt: "",
  counts: { clos: 3, activities: 4, students: 30 },
  instructors: [{ userId: "u1", name: "ครูหนึ่ง" }],
  readiness: { blockers: [] },
  ...over,
})

const row = (over: Partial<AtRiskRow> = {}): AtRiskRow => ({
  studentId: "s1",
  studentCode: "001",
  name: "หนึ่ง",
  level: "COURSE_FAIL",
  failedClos: [],
  overdue: [],
  totalScore: 42.5,
  coursePassed: false,
  ...over,
})

describe("FollowUpTable", () => {
  const props = (over: Record<string, unknown> = {}) => ({
    rows: [row()],
    enrolledCount: 30,
    passCriteria: 50,
    onOpen: vi.fn(),
    ...over,
  })

  it("lists each student with the level chip, the reason and the total", () => {
    render(<FollowUpTable {...props()} />)
    expect(screen.getByText("ไม่ผ่านรายวิชา")).toBeTruthy()
    expect(screen.getByText("คะแนนรวมต่ำกว่าเกณฑ์ผ่าน 50%")).toBeTruthy()
    expect(screen.getByText("42.5")).toBeTruthy()
  })

  it("opens the student's own page", () => {
    const p = props()
    render(<FollowUpTable {...p} />)
    fireEvent.click(screen.getByText("ดูรายบุคคล"))
    expect(p.onOpen).toHaveBeenCalledWith("s1")
  })

  it("says so when there is no roster, and when nobody needs following up", () => {
    render(<FollowUpTable {...props({ enrolledCount: 0, rows: [] })} />)
    expect(screen.getByText("ยังไม่มีรายชื่อนักศึกษา")).toBeTruthy()
    cleanup()
    render(<FollowUpTable {...props({ rows: [] })} />)
    expect(screen.getByText("ไม่มีนักศึกษาที่ต่ำกว่าเกณฑ์ใด และไม่มีใครขาดส่ง")).toBeTruthy()
  })
})

describe("CloAttainmentCard", () => {
  const attainment = (over: Partial<Attainment> = {}): Attainment => ({
    classTarget: 60,
    cloPassMark: 60,
    helpCount: 0,
    clos: [],
    meta: { computable: true, blockers: [], teachingSignals: [] },
    ...over,
  })

  it("a course with no CLO links to adding one", () => {
    inRouter(<CloAttainmentCard a={attainment()} courseId="k1" />)
    expect(screen.getByText("ยังไม่มี CLO ในรายวิชานี้", { exact: false })).toBeTruthy()
    expect(screen.getByText("เพิ่ม CLO").getAttribute("href")).toBe("/courses/k1/clos")
  })

  it("before the data loads it reads the same as a course with no CLO", () => {
    inRouter(<CloAttainmentCard a={undefined} courseId="k1" />)
    expect(screen.getByText("เพิ่ม CLO")).toBeTruthy()
  })

  it("a course that cannot be computed lists what is missing instead of a result", () => {
    inRouter(
      <CloAttainmentCard
        a={attainment({
          clos: [
            {
              cloId: "c1",
              number: 1,
              description: "",
              attainment: null,
              passedCount: 0,
              evaluableCount: 0,
              notEvaluatedCount: 0,
              atRiskCount: 0,
              provisionalCount: 0,
              target: 60,
              status: "NOT_EVALUATED",
            } as unknown as Attainment["clos"][number],
          ],
          meta: {
            computable: false,
            blockers: ["น้ำหนักกิจกรรมรวมไม่ถึง 100%"],
            teachingSignals: [],
          },
        })}
        courseId="k1"
      />,
    )
    expect(screen.getByText("ยังไม่แสดงผลการบรรลุ CLO")).toBeTruthy()
    expect(screen.getByText("น้ำหนักกิจกรรมรวมไม่ถึง 100%")).toBeTruthy()
  })
})

describe("CourseListBody", () => {
  const items = [
    course(),
    course({
      id: "k2",
      code: "03376121",
      name: "เครือข่าย",
      readiness: { blockers: ["ยังไม่มี CLO"] },
    }),
    course({ id: "k3", code: "03376122", name: "ซอฟต์แวร์", semester: 2 }),
  ]
  const props = (over: Record<string, unknown> = {}) => ({
    shown: items,
    buckets: bucketsOf(items, "term"),
    view: "card" as const,
    group: "term" as const,
    filter: "",
    act: { copy: vi.fn(), edit: vi.fn(), dup: vi.fn(), del: vi.fn() },
    ...over,
  })

  it("names the filter when nothing matches", () => {
    inRouter(<CourseListBody {...props({ shown: [], filter: "xyz" })} />)
    expect(screen.getByText("ไม่พบรายวิชาที่ตรงกับ “xyz”")).toBeTruthy()
  })

  it("card view: one section per term with its summary line, a card per course", () => {
    inRouter(<CourseListBody {...props()} />)
    expect(screen.getByText("ภาค 1/2568")).toBeTruthy()
    expect(screen.getByText("ภาค 2/2568")).toBeTruthy()
    expect(screen.getByText("2 รายวิชา · 60 นักศึกษา · พร้อมใช้งาน 1/2")).toBeTruthy()
    expect(screen.getByText("ระบบฐานข้อมูล")).toBeTruthy()
    expect(screen.getByText("1 ข้อค้าง")).toBeTruthy()
  })

  it("card view without grouping is one flat grid", () => {
    inRouter(<CourseListBody {...props({ group: "none", buckets: [] })} />)
    expect(screen.queryByText("ภาค 1/2568")).toBeNull()
    expect(screen.getByText("เครือข่าย")).toBeTruthy()
  })

  it("table view: group heads between rows, and the row's buttons fire their own action", () => {
    const p = props({ view: "table" })
    inRouter(<CourseListBody {...p} />)
    expect(screen.getAllByRole("row").length).toBe(1 + 2 + 3)
    // Newest term first, so the rows read k3 (ภาค 2), then k1, k2 (ภาค 1).
    fireEvent.click(screen.getAllByText("คัดลอกลิงก์")[0]!)
    expect(p.act.copy).toHaveBeenCalledWith(expect.objectContaining({ id: "k3" }))
    fireEvent.click(screen.getAllByText("แก้ไข")[1]!)
    expect(p.act.edit).toHaveBeenCalledWith(expect.objectContaining({ id: "k1" }))
    fireEvent.click(screen.getAllByText("ลบ")[2]!)
    expect(p.act.del).toHaveBeenCalledWith(expect.objectContaining({ id: "k2" }))
  })

  it("a course with no instructor says so, and extra instructors are counted", () => {
    inRouter(
      <CourseListBody
        {...props({
          view: "table",
          group: "none",
          shown: [
            course({ instructors: [] }),
            course({
              id: "k9",
              instructors: [
                { userId: "a", name: "ก" },
                { userId: "b", name: "ข" },
                { userId: "c", name: "ค" },
              ],
            }),
          ],
        })}
      />,
    )
    expect(screen.getByText("ยังไม่มีผู้สอน")).toBeTruthy()
    expect(screen.getByText("+2")).toBeTruthy()
  })
})
