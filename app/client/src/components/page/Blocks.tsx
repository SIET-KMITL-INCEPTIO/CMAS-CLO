/**
 * The prototype's `stat`, `chartHead`, `band` and `hollow`: the building
 * blocks of every result card. Shared because the overview and the results
 * page both lay their numbers out with them.
 */
import type { ReactNode } from "react"
import { TONE, type Tone } from "../ui/tone.ts"
import { Tip } from "./PageHeader.tsx"

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: ReactNode
  sub: ReactNode
  tone?: Tone
}) {
  return (
    <div className="statcell">
      <div className="over">{label}</div>
      <div
        className="tnum mt-1.5 text-[26px] leading-none font-light"
        style={tone ? { color: TONE[tone].tx } : undefined}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[13px] leading-snug text-dim">{sub}</div>
    </div>
  )
}

export function ChartHead({
  title,
  sub,
  help,
  right,
}: {
  title: string
  sub?: ReactNode
  help?: string
  right?: ReactNode
}) {
  return (
    <div className="chart-head">
      <div className="min-w-0">
        <h2 className="chart-title">
          {title}
          {help && <Tip text={help} />}
        </h2>
        {sub && <div className="chart-sub">{sub}</div>}
      </div>
      {right && <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>}
    </div>
  )
}

/** A label row across the top of a card. */
export function Band({ label, meta }: { label: string; meta?: ReactNode }) {
  return (
    <div className="hair flex flex-wrap items-center justify-between gap-4 px-4 py-2.5">
      <span className="over">{label}</span>
      {meta && <div className="flex items-center gap-3 text-[13px] text-dim">{meta}</div>}
    </div>
  )
}

/** One sentence in the middle of an empty card. */
export function Hollow({ children, ok }: { children: ReactNode; ok?: boolean }) {
  return (
    <div
      className={`px-5 py-10 text-center text-[14px] leading-relaxed ${ok ? "text-ok" : "text-dim"}`}
    >
      {children}
    </div>
  )
}
