import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError } from "../../lib/apiClient.ts"
import type { Grid } from "./score.types.ts"
import { ScoreGrid } from "./ScoreGrid.tsx"

/**
 * The score table (index-q viewRoster) as the teacher uses it: type and Enter,
 * paste a block, fill blanks, undo. Every write carries what the screen last
 * saw (D-3); a blank is "not assessed yet", never 0 (FR-62).
 */
const api = vi.hoisted(() => ({ put: vi.fn(), reopen: vi.fn() }))
const toast = vi.hoisted(() =>
  Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), message: vi.fn() }),
)
vi.mock("./scores.api.ts", () => ({
  scoresApi: { put: api.put, reopen: api.reopen, grid: vi.fn() },
}))
vi.mock("sonner", () => ({ toast }))

const grid = (): Grid => ({
  activities: [
    { id: "a1", name: "Quiz", maxScore: 10, passScore: 5, closedAt: null },
    { id: "a2", name: "Final", maxScore: 50, passScore: 25, closedAt: null },
  ],
  students: [
    { id: "s1", studentCode: "001", name: "หนึ่ง", status: "ENROLLED", scores: { a1: 8, a2: 40 } },
    { id: "s2", studentCode: "002", name: "สอง", status: "ENROLLED", scores: { a1: 3 } },
    { id: "s3", studentCode: "003", name: "สาม", status: "WITHDRAWN", scores: {} },
  ],
  meta: {
    total: 3,
    page: 1,
    perPage: 50,
    progress: { a1: { scored: 2, total: 2 }, a2: { scored: 1, total: 2 } },
  },
})

const actions = { edit: vi.fn(), withdraw: vi.fn(), restore: vi.fn(), remove: vi.fn() }
const show = (over: { canEdit?: boolean; grid?: Grid } = {}) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ScoreGrid
        courseId="k1"
        grid={over.grid ?? grid()}
        canEdit={over.canEdit ?? true}
        canManage
        actions={actions}
        passCriteria={50}
      />
    </QueryClientProvider>,
  )
const cell = (code: string, activity: string) =>
  screen.getByLabelText(`คะแนน ${code} · ${activity}`) as HTMLInputElement
const type = (input: HTMLInputElement, text: string) => {
  fireEvent.change(input, { target: { value: text } })
  fireEvent.keyDown(input, { key: "Enter" })
}
const rowOf = (code: string) => screen.getByText(code).closest("tr")!
/** A write goes out on a later tick (TanStack mutate): wait before saying none went. */
const settle = () => new Promise((r) => setTimeout(r, 20))

beforeEach(() => {
  api.put.mockReset().mockResolvedValue({ written: 1, unchanged: 0 })
  for (const f of [toast, toast.success, toast.error, toast.message]) f.mockClear()
  vi.stubGlobal("requestAnimationFrame", (f: FrameRequestCallback) => f(0))
})
afterEach(cleanup)

describe("ScoreGrid", () => {
  it("shows a blank as not assessed, and each row's status from its blanks", () => {
    show()
    expect(cell("002", "Final").value).toBe("")
    expect(cell("002", "Final").placeholder).toBe("–")
    expect(within(rowOf("001")).getByText("คะแนนครบ")).toBeTruthy()
    expect(within(rowOf("002")).getByText("รอ 1 ช่อง")).toBeTruthy()
    expect(within(rowOf("003")).getByText("ถอนรายวิชา")).toBeTruthy()
  })

  it("never lets a withdrawn student's cells be typed in", () => {
    show()
    expect(cell("003", "Quiz").disabled).toBe(true)
    expect(cell("001", "Quiz").disabled).toBe(false)
  })

  it("Enter writes the typed score with the value the screen saw (D-3)", async () => {
    show()
    type(cell("002", "Quiz"), "4.5")
    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1))
    expect(api.put).toHaveBeenCalledWith(
      "k1",
      [{ studentId: "s2", activityId: "a1", score: 4.5, from: 3 }],
      "MANUAL",
    )
  })

  it("writes ยกเว้น as EXCUSED, and an emptied cell as not assessed (null), never 0", async () => {
    show()
    type(cell("002", "Final"), "ยกเว้น")
    type(cell("001", "Quiz"), "")
    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(2))
    expect(api.put.mock.calls[0]![1][0]).toMatchObject({ score: "EXCUSED", from: null })
    expect(api.put.mock.calls[1]![1][0]).toMatchObject({ score: null, from: 8 })
  })

  it("refuses a score over the full mark on the screen, without asking the server", async () => {
    show()
    type(cell("002", "Quiz"), "11")
    await settle()
    expect(api.put).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("คะแนนเกินคะแนนเต็ม 10"))
  })

  it("does not write when the value did not change", async () => {
    show()
    // Typed over and back: what is left equals the saved score, so nothing goes out.
    fireEvent.change(cell("001", "Quiz"), { target: { value: "9" } })
    type(cell("001", "Quiz"), " 8 ")
    await settle()
    expect(api.put).not.toHaveBeenCalled()
  })

  it("pastes a block from Excel as one write, skipping the withdrawn row", async () => {
    show()
    fireEvent.paste(cell("001", "Quiz"), {
      clipboardData: { getData: () => "9\t45\n6\t30\n1\t1\n" },
    })
    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1))
    const [, writes, source] = api.put.mock.calls[0]!
    expect(source).toBe("PASTE")
    expect(writes).toEqual([
      { studentId: "s1", activityId: "a1", score: 9, from: 8 },
      { studentId: "s1", activityId: "a2", score: 45, from: 40 },
      { studentId: "s2", activityId: "a1", score: 6, from: 3 },
      { studentId: "s2", activityId: "a2", score: 30, from: null },
    ])
    expect(toast.message).toHaveBeenCalledWith(expect.stringContaining("ข้าม 2 ช่อง"))
  })

  it("writes nothing from a paste with one bad value (all or nothing)", async () => {
    show()
    fireEvent.paste(cell("001", "Quiz"), { clipboardData: { getData: () => "9\t99\n6\t30" } })
    await settle()
    expect(api.put).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("วางไม่ได้"))
  })

  it("fills the blanks of enrolled students with the full mark, and undo puts them back", async () => {
    show()
    fireEvent.click(screen.getAllByRole("button", { name: "เติมเต็ม" })[1]!)
    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1))
    expect(api.put.mock.calls[0]![1]).toEqual([
      { studentId: "s2", activityId: "a2", score: 50, from: null },
    ])
    expect(api.put.mock.calls[0]![2]).toBe("FILL")

    fireEvent.click(await screen.findByRole("button", { name: "เลิกทำ (1)" }))
    await waitFor(() => expect(api.put).toHaveBeenCalledTimes(2))
    expect(api.put.mock.calls[1]![1]).toEqual([
      { studentId: "s2", activityId: "a2", score: null, from: 50 },
    ])
    expect(api.put.mock.calls[1]![2]).toBe("FILL_UNDO")
    await screen.findByRole("button", { name: "เลิกทำ" })
  })

  it("names every refused cell from a 422 in one message, up to three", async () => {
    api.put.mockRejectedValue(
      new ApiError(422, "บันทึกไม่ได้", {
        rows: ["ก", "ข", "ค", "ง"].map((reason) => ({ studentId: "s", activityId: "a", reason })),
      }),
    )
    show()
    type(cell("002", "Quiz"), "4")
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("บันทึกไม่ได้ · ก · ข · ค · และอีก 1 ช่อง"),
    )
  })

  it("says how many cells somebody else changed on a 409", async () => {
    api.put.mockRejectedValue(
      new ApiError(409, "มีผู้แก้คะแนนก่อน", {
        cells: [
          { studentId: "s2", activityId: "a1", current: 5 },
          { studentId: "s2", activityId: "a2", current: 9 },
        ],
      }),
    )
    show()
    type(cell("002", "Quiz"), "4")
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("มีผู้แก้คะแนนก่อน (2 ช่อง)"))
  })

  it("is read-only for someone who cannot edit: no undo, no fill, no typing", () => {
    show({ canEdit: false })
    expect(screen.queryByRole("button", { name: /เลิกทำ/ })).toBeNull()
    expect(screen.queryByRole("button", { name: "เติมเต็ม" })).toBeNull()
    expect(cell("001", "Quiz").disabled).toBe(true)
  })

  it("takes no scores in a closed activity", () => {
    const g = grid()
    g.activities[0]!.closedAt = "2026-11-20T00:00:00.000Z"
    show({ grid: g })
    expect(cell("002", "Quiz").disabled).toBe(true)
    expect(screen.getByText("ปิดรับแล้ว")).toBeTruthy()
    expect(screen.getAllByRole("button", { name: "เติมเต็ม" })).toHaveLength(1)
    expect(screen.getByRole("button", { name: "เปิดรับ" })).toBeTruthy()
  })
})
