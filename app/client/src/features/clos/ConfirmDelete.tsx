/**
 * confirmDelete of index-q.html for a CLO or an objective: what goes with it,
 * one line on what changes, then the red button. No typed phrase — that is
 * kept for a whole course.
 */
import { Modal } from "../../components/overlay/Sheet.tsx"
import { TONE } from "../../components/ui/tone.ts"

type Props = {
  title: string
  rows: [string, number][]
  note: string
  pending: boolean
  onConfirm: () => void
  onClose: () => void
  label: string
  /** The red line on top; the default is the delete wording. */
  warning?: string
}

export function ConfirmDelete({
  title,
  rows,
  note,
  pending,
  onConfirm,
  onClose,
  label,
  warning,
}: Props) {
  const any = rows.some(([, n]) => n > 0)
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn btn-solid-danger"
            onClick={onConfirm}
            disabled={pending}
          >
            {label}
          </button>
        </>
      }
    >
      <div
        className="mb-4 rounded-lg px-4 py-3 text-[14px]"
        style={{ background: TONE.bad.bg, color: TONE.bad.tx }}
      >
        {warning ??
          (any
            ? "การลบนี้ย้อนกลับไม่ได้ และข้อมูลที่ผูกอยู่จะถูกลบตามไปด้วย"
            : "การลบนี้ย้อนกลับไม่ได้ — ยังไม่มีข้อมูลอื่นผูกอยู่")}
      </div>
      {rows.length > 0 && (
        <table className="dt">
          <tbody>
            {rows.map(([name, n]) => (
              <tr key={name}>
                <td className="text-[14px]">{name}</td>
                <td className={`num tnum text-[14px] ${n ? "text-bad" : "text-dim"}`}>{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-4 text-[14px] text-dim">{note}</div>
    </Modal>
  )
}
