import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Modal } from "./Sheet.tsx"

/** Esc closes the dialog, but not when it is only closing a dropdown list inside it. */
afterEach(cleanup)

const open = () => {
  const onClose = vi.fn()
  render(
    <Modal open onClose={onClose} title="แก้ไข CLO">
      <select className="inp" aria-label="ระดับ Bloom">
        <option value="a">จำ</option>
        <option value="b">เข้าใจ</option>
      </select>
    </Modal>,
  )
  return onClose
}

describe("Sheet and Esc", () => {
  it("closes from a field", () => {
    const onClose = open()
    fireEvent.keyDown(screen.getByRole("combobox", { name: "ระดับ Bloom" }), { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("stays open when Esc comes from an open list (focus is on an option)", () => {
    const onClose = open()
    fireEvent.keyDown(screen.getByRole("option", { name: "เข้าใจ" }), { key: "Escape" })
    expect(onClose).not.toHaveBeenCalled()
  })
})
