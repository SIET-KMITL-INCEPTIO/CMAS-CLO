import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Combobox } from "./Combobox.tsx"

/** One field that is a select and a text box: pick a listed choice, or type a new one. */
afterEach(cleanup)

const OPTIONS = [
  { key: "TEST", label: "สอบ" },
  { key: "LAB", label: "ปฏิบัติการ (Lab)" },
  { key: "CUSTOM:สัมมนา", label: "สัมมนา" },
]

function Harness({
  onChange = () => {},
  create = true,
}: {
  onChange?: (k: string) => void
  create?: boolean
}) {
  const [value, setValue] = useState("TEST")
  return (
    <Combobox
      id="c"
      value={value}
      options={OPTIONS}
      onChange={(k) => {
        setValue(k)
        onChange(k)
      }}
      create={create ? (t) => `CUSTOM:${t}` : undefined}
    />
  )
}
const box = () => screen.getByRole("combobox") as HTMLInputElement
const labels = () => screen.queryAllByRole("option").map((o) => o.textContent)

describe("Combobox", () => {
  it("shows the chosen label, and every choice when opened", () => {
    render(<Harness />)
    expect(box().value).toBe("สอบ")
    fireEvent.focus(box())
    expect(labels()).toEqual(["สอบ✓", "ปฏิบัติการ (Lab)", "สัมมนา"])
  })

  it("picks a listed choice with the mouse", () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    fireEvent.focus(box())
    fireEvent.click(screen.getByRole("option", { name: "ปฏิบัติการ (Lab)" }))
    expect(onChange).toHaveBeenCalledWith("LAB")
    expect(box().value).toBe("ปฏิบัติการ (Lab)")
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("filters as you type, and offers to add a name that is not listed", () => {
    render(<Harness />)
    fireEvent.change(box(), { target: { value: "สัม" } })
    expect(labels()).toEqual(["สัมมนา", "+ เพิ่ม “สัม”"])
    fireEvent.change(box(), { target: { value: "กรณีศึกษา" } })
    expect(labels()).toEqual(["+ เพิ่ม “กรณีศึกษา”"])
  })

  it("does not offer to add a name that is already there, whatever the case", () => {
    render(<Harness />)
    fireEvent.change(box(), { target: { value: "สัมมนา" } })
    expect(labels()).toEqual(["สัมมนา"])
  })

  it("adds a new name with Enter, and keeps it in the list afterwards", () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    fireEvent.change(box(), { target: { value: "  กรณีศึกษา " } })
    fireEvent.keyDown(box(), { key: "Enter" })
    expect(onChange).toHaveBeenCalledWith("CUSTOM:กรณีศึกษา")
    expect(box().value).toBe("กรณีศึกษา")
    fireEvent.focus(box())
    expect(labels()).toContain("กรณีศึกษา✓")
  })

  it("keeps a typed name when the field is left, instead of dropping it silently", () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    fireEvent.change(box(), { target: { value: "สัมมนา" } })
    fireEvent.blur(box())
    expect(onChange).toHaveBeenCalledWith("CUSTOM:สัมมนา")
    fireEvent.change(box(), { target: { value: "ทดลองใหม่" } })
    fireEvent.blur(box())
    expect(onChange).toHaveBeenLastCalledWith("CUSTOM:ทดลองใหม่")
  })

  it("an emptied field goes back to the choice it had", () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    fireEvent.change(box(), { target: { value: "" } })
    fireEvent.blur(box())
    expect(onChange).not.toHaveBeenCalled()
    expect(box().value).toBe("สอบ")
  })

  it("moves with the arrow keys", () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    fireEvent.focus(box())
    fireEvent.keyDown(box(), { key: "ArrowDown" })
    fireEvent.keyDown(box(), { key: "ArrowDown" })
    fireEvent.keyDown(box(), { key: "ArrowUp" })
    fireEvent.keyDown(box(), { key: "Enter" })
    expect(onChange).toHaveBeenCalledWith("LAB")
  })

  it("Escape closes the list and does not reach the dialog behind it", () => {
    const behind = vi.fn()
    document.addEventListener("keydown", behind)
    render(<Harness />)
    fireEvent.focus(box())
    fireEvent.keyDown(box(), { key: "Escape" })
    expect(screen.queryByRole("listbox")).toBeNull()
    expect(behind).not.toHaveBeenCalled()
    fireEvent.keyDown(box(), { key: "Escape" }) // list already closed: the dialog may close
    expect(behind).toHaveBeenCalledOnce()
    document.removeEventListener("keydown", behind)
  })

  it("only the listed choices when new names are not allowed", () => {
    render(<Harness create={false} />)
    fireEvent.change(box(), { target: { value: "ไม่มีรายการนี้" } })
    expect(labels()).toEqual([])
  })

  it("says what it is to a screen reader", () => {
    render(<Harness />)
    fireEvent.focus(box())
    expect(box().getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByRole("listbox").id).toBe(box().getAttribute("aria-controls"))
    expect(screen.getByRole("option", { name: /สอบ/ }).getAttribute("aria-selected")).toBe("true")
  })
})
