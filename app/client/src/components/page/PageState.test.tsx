import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ApiError, messageFor, NETWORK_MESSAGE } from "../../lib/apiClient.ts"
import { errorText } from "../../lib/errorText.ts"
import { PageState } from "./PageState.tsx"

/** U-3 / UI-3 / UI-7: loading, failed, empty and loaded, all in Thai, with what to do. */
afterEach(cleanup)

const THAI = /[฀-๿]/
const DATA = <div>ข้อมูล</div>

describe("PageState", () => {
  it("says what is loading, as a status", () => {
    render(
      <PageState loading error={null} what="รายวิชา">
        {DATA}
      </PageState>,
    )
    expect(screen.getByRole("status").textContent).toBe("กำลังโหลดรายวิชา…")
    expect(screen.queryByText("ข้อมูล")).toBeNull()
  })

  it("shows a failure as an alert with the reason and a retry that reloads", () => {
    const retry = vi.fn()
    render(
      <PageState
        loading={false}
        error={new ApiError(500, messageFor(500))}
        onRetry={retry}
        what="รายวิชา"
      >
        {DATA}
      </PageState>,
    )
    const alert = screen.getByRole("alert")
    expect(alert.textContent).toContain("โหลดรายวิชาไม่สำเร็จ")
    expect(alert.textContent).toContain("ลองใหม่อีกครั้ง")
    fireEvent.click(screen.getByRole("button", { name: "ลองใหม่" }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it("shows the empty state, and never an empty frame, when loaded with nothing", () => {
    render(
      <PageState
        loading={false}
        error={null}
        empty
        emptyState={<p>ยังไม่มีรายวิชา — สร้างรายวิชา</p>}
      >
        {DATA}
      </PageState>,
    )
    expect(screen.getByText(/ยังไม่มีรายวิชา/)).toBeTruthy()
    expect(screen.queryByText("ข้อมูล")).toBeNull()
  })

  it("shows the data when there is some", () => {
    render(
      <PageState loading={false} error={null}>
        {DATA}
      </PageState>,
    )
    expect(screen.getByText("ข้อมูล")).toBeTruthy()
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("shows the failure, not stale data, when a reload fails", () => {
    render(
      <PageState loading={false} error={new TypeError("Failed to fetch")}>
        {DATA}
      </PageState>,
    )
    expect(screen.queryByText("ข้อมูล")).toBeNull()
    expect(screen.getByRole("alert").textContent).toContain(NETWORK_MESSAGE)
  })
})

describe("errorText (UI-7)", () => {
  it("is Thai for every kind of failure, with no stack or English left", () => {
    const failures = [
      new ApiError(400, messageFor(400)),
      new ApiError(403, messageFor(403)),
      new ApiError(404, messageFor(404)),
      new ApiError(500, messageFor(500)),
      new TypeError("Failed to fetch"),
      new Error("boom"),
      "something",
      null,
    ]
    for (const f of failures) {
      const text = errorText(f)
      expect(text, String(f)).toMatch(THAI)
      expect(text).not.toMatch(/Error|fetch|boom|stack|undefined/)
    }
  })

  it("keeps the server's own message when it sent one", () => {
    expect(errorText(new ApiError(422, "กิจกรรมนี้ปิดรับคะแนนแล้ว"))).toBe(
      "กิจกรรมนี้ปิดรับคะแนนแล้ว",
    )
  })

  it("answers a reply with no message of its own (a proxy's page) in Thai with a way forward", () => {
    for (const status of [400, 403, 404, 502]) expect(messageFor(status)).toMatch(/—/)
  })
})
