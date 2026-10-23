/**
 * Modal and drawer — the prototype's `#modal` and `#drawer`: one scrim, a
 * sheet that fades in, Esc and the scrim close it, focus moves into it and
 * returns to the opener on close. On a phone both become bottom sheets (CSS).
 */
import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Icon } from "../Icon.tsx"

type SheetProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  sub?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

function Sheet(props: SheetProps & { kind: "modal" | "drawer" }) {
  return props.open ? <OpenSheet {...props} /> : null
}

/** Mounted only while open: `on` starts false each time, so the sheet fades in. */
function OpenSheet({
  kind,
  onClose,
  title,
  sub,
  footer,
  children,
}: SheetProps & { kind: "modal" | "drawer" }) {
  const box = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)
  // Callers pass a new onClose on every render; the effect below must run once
  // per opening, or focus would jump back to the opener on each keystroke.
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  })

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const frame = requestAnimationFrame(() => {
      setOn(true)
      box.current
        ?.querySelector<HTMLElement>("input, select, textarea, button:not([data-close])")
        ?.focus()
    })
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current()
    document.addEventListener("keydown", onKey)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener("keydown", onKey)
      opener?.focus?.()
    }
  }, [])

  return createPortal(
    <>
      <div className={`scrim no-print ${on ? "on" : ""}`} onClick={onClose} aria-hidden="true" />
      <div
        ref={box}
        className={`sheetbox ${kind === "modal" ? "modalbox" : "drawerbox"} no-print ${on ? "on" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
      >
        <div className="sheethead">
          <div className="min-w-0 flex-1">
            <div className="text-[18px] leading-snug text-ink">{title}</div>
            {sub && <div className="mt-0.5 text-[13px] text-dim">{sub}</div>}
          </div>
          <button
            type="button"
            className="btn-quiet btn"
            onClick={onClose}
            aria-label="ปิด"
            data-close
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
        <div className="sheetbody">{children}</div>
        {footer && <div className="sheetfoot">{footer}</div>}
      </div>
    </>,
    document.body,
  )
}

export const Modal = (p: SheetProps) => <Sheet kind="modal" {...p} />
export const Drawer = (p: SheetProps) => <Sheet kind="drawer" {...p} />
