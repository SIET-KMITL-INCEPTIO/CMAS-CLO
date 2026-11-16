/**
 * `pill` and `chip` of index-q.html: a pill states a fact, a chip states a
 * status in one of the five tones. Status colours live here and nowhere else.
 */
import type { ReactNode } from "react"
import { TONE, type Tone } from "./tone.ts"

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-xs bg-wash px-2.5 py-1 text-[13px] whitespace-nowrap text-ink2">
      {children}
    </span>
  )
}

export function Chip({
  tone = "nil",
  title,
  children,
}: {
  tone?: Tone
  title?: string
  children: ReactNode
}) {
  const c = TONE[tone]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[13px] whitespace-nowrap"
      style={{ background: c.bg, color: c.tx }}
      title={title}
    >
      {children}
    </span>
  )
}

/** A form field with its label above and its error below (U5). */
export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  hint?: string
  error?: string | null
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[14px] text-ink2" htmlFor={htmlFor}>
        {label} {required && <span className="text-bad">*</span>}
      </label>
      {children}
      {hint && !error && <div className="mt-1 text-[12.5px] text-dim">{hint}</div>}
      {error && <div className="ferr">{error}</div>}
    </div>
  )
}
