import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CommandPalette } from "./CommandPalette.tsx"
import { CoursePane } from "./CoursePane.tsx"
import { useTermFilter } from "./termFilter.ts"

/** The list pane's term filter, saved per browser, and Ctrl K following it. */
const course = (id: string, code: string, name: string, semester: number, year: number) => ({
  id,
  code,
  name,
  semester,
  year,
  section: "01",
  counts: { clos: 0, activities: 0, students: 0 },
})
const COURSES = [
  course("a", "03376132", "ปัญญาประดิษฐ์", 1, 2570),
  course("b", "30258745", "ทดสอบ", 2, 2569),
]

const state = vi.hoisted(() => ({
  list: {} as { data?: { courses: object[] }; isLoading: boolean },
  role: "INSTRUCTOR",
}))
vi.mock("../../features/courses/useCourses.ts", async (real) => ({
  ...(await real<object>()),
  useCourseList: () => state.list,
}))
vi.mock("../../features/auth/useAuthStore.ts", () => ({
  useAuthStore: (pick: (s: object) => unknown) => pick({ me: { role: state.role } }),
}))
vi.mock("../../hooks/useCan.ts", () => ({ useCan: () => () => state.role === "INSTRUCTOR" }))

const pane = (at = "/") =>
  render(
    <MemoryRouter initialEntries={[at]}>
      <CoursePane onNavigate={() => {}} />
    </MemoryRouter>,
  )
const palette = () =>
  render(
    <MemoryRouter>
      <CommandPalette open onClose={() => {}} />
    </MemoryRouter>,
  )
const list = () => screen.getByRole("complementary", { name: "รายการรายวิชา" })

beforeEach(() => {
  localStorage.clear()
  useTermFilter.setState({ term: "all" })
  state.list = { data: { courses: COURSES }, isLoading: false }
  state.role = "INSTRUCTOR"
})
afterEach(cleanup)

describe("term filter in the list pane", () => {
  it("shows every term until one is picked, then only that term, and saves it", () => {
    pane()
    expect(within(list()).getByText("ปัญญาประดิษฐ์")).toBeTruthy()
    expect(within(list()).getByText("ทดสอบ")).toBeTruthy()

    fireEvent.change(screen.getByRole("combobox", { name: "ภาคการศึกษา" }), {
      target: { value: "2570-1" },
    })
    expect(within(list()).getByText("ปัญญาประดิษฐ์")).toBeTruthy()
    expect(within(list()).queryByText("ทดสอบ")).toBeNull()
    expect(localStorage.getItem("cmas-term")).toBe("2570-1")
  })

  it("ignores a saved term the caller no longer has", () => {
    useTermFilter.setState({ term: "2560-1" })
    pane()
    expect(within(list()).getByText("ทดสอบ")).toBeTruthy()
    expect((screen.getByRole("combobox", { name: "ภาคการศึกษา" }) as HTMLSelectElement).value).toBe(
      "all",
    )
  })
})

describe("list pane states", () => {
  it("hides the term picker when there is only one term", () => {
    state.list = { data: { courses: [COURSES[0]!] }, isLoading: false }
    pane()
    expect(screen.queryByRole("combobox", { name: "ภาคการศึกษา" })).toBeNull()
  })

  it("says it is loading, then that there are no courses yet", () => {
    state.list = { isLoading: true }
    const { unmount } = pane()
    expect(screen.getByText("กำลังโหลด…")).toBeTruthy()
    unmount()
    state.list = { data: { courses: [] }, isLoading: false }
    pane()
    expect(screen.getByText(/ยังไม่มีรายวิชาในความดูแลของคุณ/)).toBeTruthy()
  })

  it("says nothing matched the typed filter", () => {
    pane()
    fireEvent.change(screen.getByRole("textbox", { name: "กรองรายการ" }), {
      target: { value: "ไม่มีวิชานี้" },
    })
    expect(screen.getByText("ไม่พบรายวิชาที่ตรงกับคำค้น")).toBeTruthy()
  })

  it("opens the course in the URL and folds it on click", () => {
    pane("/courses/a/clos")
    expect(within(list()).getByRole("link", { name: /^CLO/ })).toBeTruthy()
    fireEvent.click(within(list()).getByText("ปัญญาประดิษฐ์"))
    expect(within(list()).queryByRole("link", { name: /^CLO/ })).toBeNull()
  })

  it("titles an admin's list as every course, with no create button", () => {
    state.role = "ADMIN"
    pane()
    expect(screen.getByText("รายวิชาทั้งหมด")).toBeTruthy()
    expect(screen.queryByRole("button", { name: /สร้างรายวิชา/ })).toBeNull()
  })
})

describe("Ctrl K", () => {
  it("moves with the arrow keys and says when nothing is found", () => {
    palette()
    const input = screen.getByRole("textbox", { name: "ค้นหา" })
    fireEvent.keyDown(input, { key: "ArrowDown" })
    expect(screen.getAllByRole("option")[1]!.getAttribute("aria-selected")).toBe("true")
    fireEvent.keyDown(input, { key: "ArrowUp" })
    expect(screen.getAllByRole("option")[0]!.getAttribute("aria-selected")).toBe("true")
    fireEvent.change(input, { target: { value: "ไม่มีอะไรตรง" } })
    expect(screen.getByText("ไม่พบ")).toBeTruthy()
  })

  it("lists only the courses of the chosen term, and says so", () => {
    useTermFilter.setState({ term: "2569-2" })
    palette()
    const box = screen.getByRole("listbox", { name: "ผลการค้นหา" })
    expect(within(box).getByText(/30258745 ทดสอบ/)).toBeTruthy()
    expect(within(box).queryByText(/03376132/)).toBeNull()
    expect(screen.getByText(/แสดงเฉพาะภาค 2\/2569/)).toBeTruthy()
  })

  it("lists courses only until something is typed, then their pages too", () => {
    palette()
    const box = () => screen.getByRole("listbox", { name: "ผลการค้นหา" })
    expect(within(box()).queryByText(/^CLO · /)).toBeNull()
    fireEvent.change(screen.getByRole("textbox", { name: "ค้นหา" }), { target: { value: "clo" } })
    expect(within(box()).getAllByText(/^CLO · /)).toHaveLength(2)
  })
})
