import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Me } from "../../types/user.types.ts"
import { nameError } from "./profile.ts"
import { ProfileModal } from "./ProfileModal.tsx"
import { useAuthStore } from "./useAuthStore.ts"

/** "บัญชีของฉัน" (UC 9.1): the owner edits their name; email, role and courses are shown only. */
const api = vi.hoisted(() => ({ patch: vi.fn() }))
const toast = vi.hoisted(() => Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }))
vi.mock("../../lib/apiClient.ts", async (real) => ({
  ...(await real<object>()),
  apiClient: api,
}))
vi.mock("sonner", () => ({ toast }))

const ME: Me = {
  id: "u1",
  email: "somchai@kmitl.ac.th",
  name: "สมชาย",
  role: "INSTRUCTOR",
  status: "ACTIVE",
  courseCount: 3,
}

let onClose: ReturnType<typeof vi.fn<() => void>>
const open = (me: Me = ME) => {
  useAuthStore.getState().signedIn(me, "token")
  onClose = vi.fn<() => void>()
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ProfileModal open onClose={onClose} />
    </QueryClientProvider>,
  )
}
const nameBox = () => screen.getByLabelText(/ชื่อ-สกุล/) as HTMLInputElement
const save = () => fireEvent.click(screen.getByRole("button", { name: "บันทึก" }))

beforeEach(() => {
  api.patch.mockReset()
  toast.mockClear()
  toast.success.mockClear()
  toast.error.mockClear()
})
afterEach(cleanup)

describe("nameError", () => {
  it("needs a name, at most 100 characters once trimmed", () => {
    expect(nameError("  ")).toBe("กรอกชื่อ-สกุลก่อน")
    expect(nameError("ก".repeat(101))).toMatch("ไม่เกิน 100")
    expect(nameError(` ${"ก".repeat(100)} `)).toBeNull()
  })
})

describe("ProfileModal", () => {
  it("shows the account: the name to edit, and email, role and courses as facts", () => {
    open()
    expect(screen.getByRole("dialog", { name: "บัญชีของฉัน" })).toBeTruthy()
    expect(nameBox().value).toBe("สมชาย")
    expect(screen.getByText("somchai@kmitl.ac.th").tagName).not.toBe("INPUT")
    expect(screen.getByText("ผู้สอน")).toBeTruthy()
    expect(screen.getByText("3 รายวิชา")).toBeTruthy()
    // Role and status are the admin's: no control for them here.
    expect(screen.queryByRole("combobox")).toBeNull()
    expect(screen.getAllByRole("textbox")).toHaveLength(1)
  })

  it("an admin sees every course, not a count of courses taught", () => {
    open({ ...ME, role: "ADMIN", courseCount: 0 })
    expect(screen.getByText("ผู้ดูแลระบบ")).toBeTruthy()
    expect(screen.getByText("ทุกรายวิชา")).toBeTruthy()
    expect(screen.queryByText("0 รายวิชา")).toBeNull()
  })

  it("saves a new name, trimmed, and the account menu follows", async () => {
    api.patch.mockResolvedValue({ ...ME, name: "สมชาย ใจดี" })
    open()
    fireEvent.change(nameBox(), { target: { value: "  สมชาย ใจดี " } })
    save()
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(api.patch).toHaveBeenCalledWith("/auth/me", { name: "สมชาย ใจดี" })
    expect(useAuthStore.getState().me?.name).toBe("สมชาย ใจดี")
    expect(toast.success).toHaveBeenCalledWith("บันทึกชื่อแล้ว")
  })

  it("an empty name is stopped before the server, next to the field", () => {
    open()
    fireEvent.change(nameBox(), { target: { value: "   " } })
    save()
    expect(screen.getByText("กรอกชื่อ-สกุลก่อน")).toBeTruthy()
    expect(nameBox().getAttribute("aria-invalid")).toBe("true")
    expect(api.patch).not.toHaveBeenCalled()
    fireEvent.change(nameBox(), { target: { value: "ส" } })
    expect(screen.queryByText("กรอกชื่อ-สกุลก่อน")).toBeNull()
  })

  it("the same name closes without a request", () => {
    open()
    save()
    expect(api.patch).not.toHaveBeenCalled()
    expect(toast).toHaveBeenCalledWith("ไม่มีอะไรเปลี่ยน")
    expect(onClose).toHaveBeenCalled()
  })

  it("a refused save stays open and says why", async () => {
    api.patch.mockRejectedValue(new Error("เชื่อมต่อระบบไม่ได้"))
    open()
    fireEvent.change(nameBox(), { target: { value: "ใหม่" } })
    save()
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("เชื่อมต่อระบบไม่ได้"))
    expect(onClose).not.toHaveBeenCalled()
    expect(useAuthStore.getState().me?.name).toBe("สมชาย")
  })
})
