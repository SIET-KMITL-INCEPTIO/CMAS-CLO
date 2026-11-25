/**
 * One field that is both a select and a text box: pick a listed choice, or type
 * a name that is not listed and it becomes a choice ("เพิ่ม “…”"). It replaces a
 * select with a "+ กำหนดเอง…" row that opened a second field below it.
 *
 * Keys, not labels, are what the parent holds. A new name gets its key from
 * `create`, and joins the list for as long as the field is mounted.
 */
import { useId, useState } from "react"

export type ComboOption = { key: string; label: string }

type Row = { kind: "option"; option: ComboOption } | { kind: "new"; text: string }

export function Combobox({
  id,
  value,
  options,
  onChange,
  create,
  placeholder,
  maxLength,
  invalid,
}: {
  id: string
  /** The key of the chosen option. */
  value: string
  options: ComboOption[]
  onChange: (key: string) => void
  /** The key for a name that is not in the list. Leave out to allow only the listed choices. */
  create?: (text: string) => string
  placeholder?: string
  maxLength?: number
  invalid?: boolean
}) {
  const listId = useId()
  const [added, setAdded] = useState<ComboOption[]>([])
  /** What is being typed; null while the field just shows the chosen label. */
  const [text, setText] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const all = [...options, ...added.filter((a) => !options.some((o) => o.key === a.key))]
  const shown = text ?? all.find((o) => o.key === value)?.label ?? ""
  const needle = (text ?? "").trim().toLowerCase()
  const listed = needle ? all.filter((o) => o.label.toLowerCase().includes(needle)) : all
  const same = all.find((o) => o.label.toLowerCase() === needle)
  const rows: Row[] = listed.map((option) => ({ kind: "option", option }))
  if (create && needle && !same) rows.push({ kind: "new", text: (text ?? "").trim() })

  const settle = () => {
    setText(null)
    setOpen(false)
  }
  const pick = (key: string) => {
    onChange(key)
    settle()
  }
  const pickRow = (row: Row | undefined) => {
    if (!row) return
    if (row.kind === "option") return pick(row.option.key)
    const key = create!(row.text)
    setAdded((a) => [...a, { key, label: row.text }])
    pick(key)
  }
  /** Leaving the field with a name typed in it keeps that name; leaving it empty keeps the old choice. */
  const leave = () => {
    if (text !== null && needle) pickRow(same ? { kind: "option", option: same } : rows.at(-1))
    settle()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      setOpen(true)
      setActive((a) => Math.min(Math.max(a + (e.key === "ArrowDown" ? 1 : -1), 0), rows.length - 1))
    } else if (e.key === "Enter" && open) {
      pickRow(rows[active])
    } else if (e.key === "Escape" && open) {
      e.stopPropagation() // closes the list, not the dialog behind it
      settle()
    } else return
    e.preventDefault()
  }

  return (
    <div className="combo">
      <input
        id={id}
        className="inp"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && rows[active] ? `${listId}-${active}` : undefined}
        aria-invalid={invalid ? true : undefined}
        autoComplete="off"
        placeholder={placeholder}
        maxLength={maxLength}
        value={shown}
        onFocus={(e) => {
          e.currentTarget.select()
          setOpen(true)
        }}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          setText(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onKeyDown={onKeyDown}
        onBlur={leave}
      />
      <svg className="combo-caret" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      {open && rows.length > 0 && (
        // mouse-down is stopped so the field keeps focus and does not "leave" before the click lands
        <ul
          id={listId}
          className="combo-list"
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
        >
          {rows.map((row, i) => (
            <li
              key={row.kind === "option" ? row.option.key : "new"}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={row.kind === "option" && row.option.key === value}
              data-active={i === active}
              className="combo-opt"
              onMouseEnter={() => setActive(i)}
              onClick={() => pickRow(row)}
            >
              {row.kind === "option" ? (
                <>
                  <span className="truncate">{row.option.label}</span>
                  {row.option.key === value && <span aria-hidden="true">✓</span>}
                </>
              ) : (
                <span className="truncate">
                  + เพิ่ม “<b className="font-medium">{row.text}</b>”
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
