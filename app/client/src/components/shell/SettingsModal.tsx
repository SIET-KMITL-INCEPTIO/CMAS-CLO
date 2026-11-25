/**
 * "การแสดงผล" from the account menu: the look of the app — theme, text size,
 * row density — saved in this browser (display.ts). The name is edited in
 * "บัญชีของฉัน" (features/auth/ProfileModal.tsx), with the rest of the account.
 */
import { Modal } from "../overlay/Sheet.tsx"
import { DENSITIES, SCALES, THEMES, useDisplay } from "./display.ts"

function Choice<T extends string>({
  legend,
  options,
  value,
  onPick,
}: {
  legend: string
  options: { id: T; label: string }[]
  value: T
  onPick: (id: T) => void
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-[14px] text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className="chipbtn"
            aria-current={value === o.id}
            onClick={() => onPick(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function SettingsBody() {
  const display = useDisplay()
  return (
    <div className="grid gap-5">
      <Choice
        legend="ธีม"
        options={THEMES}
        value={display.theme}
        onPick={(theme) => display.set({ theme })}
      />
      <Choice
        legend="ขนาดตัวอักษร"
        options={SCALES}
        value={display.scale}
        onPick={(scale) => display.set({ scale })}
      />
      <Choice
        legend="ความหนาแน่นของแถวในตาราง"
        options={DENSITIES}
        value={display.density}
        onPick={(density) => display.set({ density })}
      />
    </div>
  )
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="การแสดงผล">
      {open ? <SettingsBody /> : null}
    </Modal>
  )
}
