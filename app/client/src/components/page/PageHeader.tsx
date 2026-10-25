/**
 * The content pane's head (`.chead` in index-q.html): title, one short line
 * under it, then the page's tools — primary first, the `?` help last.
 * Explanations live behind the `?`, never as prose on the page (W1).
 */
import { useState, type ReactNode } from "react"
import { Modal } from "../overlay/Sheet.tsx"

type Props = {
  title: string
  sub?: ReactNode
  tools?: ReactNode
  /** One or two short lines; shown when the reader asks with `?`. */
  help?: ReactNode
}

export function PageHeader({ title, sub, tools, help }: Props) {
  const [helpOpen, setHelpOpen] = useState(false)
  return (
    <div className="chead no-print">
      <div className="min-w-0">
        <h1 className="ctitle">{title}</h1>
        {sub && <div className="csub">{sub}</div>}
      </div>
      {(tools || help) && (
        <div className="ctools">
          {tools}
          {help && (
            <button
              type="button"
              className="helpbtn"
              aria-label="คำอธิบายหน้านี้"
              title="คำอธิบายหน้านี้"
              onClick={() => setHelpOpen(true)}
            >
              ?
            </button>
          )}
        </div>
      )}
      {help && (
        <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title={title}>
          <div className="text-[14px] leading-relaxed text-ink2">{help}</div>
        </Modal>
      )}
    </div>
  )
}

/** Sub-views of one page (`SUBTABS`): the Teams "Posts | Files | Wiki" row. */
export function SubTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: readonly { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <nav className="subtabs no-print" aria-label="มุมมองย่อย">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className="stab"
          aria-current={t.id === value ? "page" : undefined}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}

/** The small `i` beside a number: one short sentence on hover or focus. */
export function Tip({ text }: { text: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const show = (el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    setPos({ x: Math.min(r.left, window.innerWidth - 330), y: r.bottom + 6 })
  }
  return (
    <>
      <i
        className="tipbtn"
        tabIndex={0}
        aria-label={text}
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={() => setPos(null)}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={() => setPos(null)}
      >
        i
      </i>
      {pos && (
        <div className="tipbox" role="tooltip" style={{ left: pos.x, top: pos.y }}>
          {text}
        </div>
      )}
    </>
  )
}
