/**
 * The four states of a page that reads data (UI-3, U-3): loading, failed,
 * empty, and the data itself. One place, so no page invents its own wording
 * and every failure says what to do (UI-7).
 */
import type { ReactNode } from "react"
import { errorText } from "../../lib/errorText.ts"

type Props = {
  loading: boolean
  error: unknown
  /** Reload what failed; shown as "ลองใหม่". */
  onRetry?: () => void
  /** True when the data arrived and there is nothing in it. */
  empty?: boolean
  /** The empty state, usually the next step to take. */
  emptyState?: ReactNode
  /** Names what is loading, e.g. "รายวิชา" → "กำลังโหลดรายวิชา…". */
  what?: string
  children: ReactNode
}

export function PageState({
  loading,
  error,
  onRetry,
  empty,
  emptyState,
  what = "",
  children,
}: Props) {
  if (loading) {
    return (
      <div role="status" className="text-[14px] text-dim">
        กำลังโหลด{what}…
      </div>
    )
  }
  if (error) {
    return (
      <div role="alert" className="card px-6 py-8 text-center">
        <div className="text-[16px] text-ink">โหลด{what || "ข้อมูล"}ไม่สำเร็จ</div>
        <div className="mx-auto mt-1.5 max-w-[56ch] text-[14px] text-ink2">{errorText(error)}</div>
        {onRetry && (
          <button type="button" className="btn mt-4" onClick={onRetry}>
            ลองใหม่
          </button>
        )}
      </div>
    )
  }
  if (empty) return <>{emptyState}</>
  return <>{children}</>
}
