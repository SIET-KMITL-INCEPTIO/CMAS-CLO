import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ApiError, messageFor } from "../../lib/apiClient.ts"
import Home from "../home/Home.page.tsx"
import { CourseLayout } from "./CourseLayout.tsx"

/** U-3 / UI-3: the pages that read a course say when it failed, and never call a fault "not found". */
const state = vi.hoisted(() => ({ list: {} as object, one: {} as object }))
vi.mock("./useCourses.ts", () => ({
  useCourseList: () => state.list,
  useCourse: () => state.one,
  byTerm: () => 0,
}))

afterEach(cleanup)

const home = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<div>จัดการรายวิชา</div>} />
      </Routes>
    </MemoryRouter>,
  )

const layout = () =>
  render(
    <MemoryRouter initialEntries={["/courses/c1"]}>
      <Routes>
        <Route path="/courses/:courseId" element={<CourseLayout />}>
          <Route index element={<div>หน้ารายวิชา</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe("Home", () => {
  it("shows a failure with a retry instead of an empty page", () => {
    const refetch = vi.fn()
    state.list = { isLoading: false, error: new ApiError(500, messageFor(500)), refetch }
    home()
    expect(screen.getByRole("alert").textContent).toContain("โหลดรายวิชาไม่สำเร็จ")
    fireEvent.click(screen.getByRole("button", { name: "ลองใหม่" }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it("shows loading, then lands on the course manager when there is no course", () => {
    state.list = { isLoading: true, error: null, refetch: vi.fn() }
    const view = home()
    expect(screen.getByRole("status")).toBeTruthy()
    view.unmount()
    state.list = { isLoading: false, error: null, data: { courses: [] }, refetch: vi.fn() }
    home()
    expect(screen.getByText("จัดการรายวิชา")).toBeTruthy()
  })
})

describe("CourseLayout", () => {
  it("says 'not found' only for a 404 — a course that is not yours looks the same (A-13)", () => {
    state.one = { isLoading: false, error: new ApiError(404, messageFor(404)), refetch: vi.fn() }
    layout()
    expect(screen.getByText("ไม่พบรายวิชา")).toBeTruthy()
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("treats a server fault or lost connection as a failure that can be retried", () => {
    const refetch = vi.fn()
    state.one = { isLoading: false, error: new ApiError(500, messageFor(500)), refetch }
    layout()
    expect(screen.queryByText("ไม่พบรายวิชา")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "ลองใหม่" }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it("shows the page once the course is there", () => {
    state.one = { isLoading: false, error: null, data: { id: "c1" }, refetch: vi.fn() }
    layout()
    expect(screen.getByText("หน้ารายวิชา")).toBeTruthy()
  })
})
