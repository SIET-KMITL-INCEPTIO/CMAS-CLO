/**
 * แป้นพิมพ์ลัด — index-q's modalShortcuts, listing only what this app really
 * answers to (the prototype's 1–9, "/" and "N" are not built, so not listed).
 * Opened with "?" anywhere outside a text field, or from the account menu.
 */
import { Modal } from "../overlay/Sheet.tsx"
import { SHORTCUTS } from "./shortcuts.ts"

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="แป้นพิมพ์ลัด"
      footer={
        <button type="button" className="btn" onClick={onClose}>
          ปิด
        </button>
      }
    >
      <dl className="space-y-1">
        {SHORTCUTS.map(([key, what]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-6 border-b border-edge2 py-2 last:border-0"
          >
            <dt className="text-[14px] text-ink2">{what}</dt>
            <dd>
              <kbd>{key}</kbd>
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}
