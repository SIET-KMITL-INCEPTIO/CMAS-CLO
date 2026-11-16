/**
 * index-q's `inlineNum`: a number edited in place on the page. It saves on
 * Enter or when focus leaves, only when the value changed and is valid; Esc
 * puts the saved value back. While the save runs the box shows what was typed.
 */
import { useState } from "react"

type Props = {
  value: number | null
  label: string
  /** Resolves when saved; a rejection puts the saved value back (the caller shows the error). */
  onSave: (v: number) => Promise<unknown>
  min?: number
  max?: number
  width?: number
  disabled?: boolean
}

export function InlineNumber({
  value,
  label,
  onSave,
  min = 0,
  max = 100,
  width = 64,
  disabled,
}: Props) {
  const shown = value === null ? "" : String(value)
  // The draft lives only while the box is being edited; otherwise the saved value shows.
  const [draft, setDraft] = useState<string | null>(null)
  // What was sent, shown until the page's value catches up — not the old value flashing back.
  const [sent, setSent] = useState<{ text: string; over: number | null } | null>(null)
  const text = draft ?? (sent && sent.over === value ? sent.text : shown)
  const n = Number(text)
  const bad = draft !== null && (text.trim() === "" || !Number.isFinite(n) || n < min || n > max)

  const commit = () => {
    if (draft === null) return
    if (!bad && n !== value) {
      const mine = { text: String(n), over: value }
      setSent(mine)
      onSave(n).then(
        () => undefined,
        () => setSent((x) => (x === mine ? null : x)),
      )
    }
    setDraft(null)
  }

  return (
    <input
      className="inp tnum !px-2 !py-1 text-right text-[14px]"
      style={{ width }}
      value={text}
      inputMode="decimal"
      aria-label={label}
      aria-invalid={bad || undefined}
      title={`${label} · กด Enter หรือออกจากช่องเพื่อบันทึก`}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur()
        if (e.key === "Escape") {
          setDraft(null)
          e.currentTarget.blur()
        }
      }}
    />
  )
}
