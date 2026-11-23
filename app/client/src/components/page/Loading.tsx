/**
 * The one loading indicator (UI-3): a small spinning ring beside "กำลังโหลด…".
 * The ring is decoration; the text is what a screen reader hears.
 */
type Props = {
  /** Names what is loading, e.g. "รายวิชา" → "กำลังโหลดรายวิชา…". */
  what?: string
  /** Spacing or alignment for where it sits (padding, centring). */
  className?: string
}

export function Loading({ what = "", className = "" }: Props) {
  return (
    <div role="status" className={`loading ${className}`.trim()}>
      <span className="spinner" aria-hidden="true" />
      กำลังโหลด{what}…
    </div>
  )
}
