/**
 * "ตั้งค่า" from the account menu: the user's own display name (saved to the
 * account) and the look of the app — theme, text size, row density (saved in
 * this browser, see display.ts).
 */
import { useState } from "react"
import { toast } from "sonner"
import { useAuthStore } from "../../features/auth/useAuthStore.ts"
import { apiClient } from "../../lib/apiClient.ts"
import type { Me } from "../../types/user.types.ts"
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
  const me = useAuthStore((s) => s.me)
  const signedIn = useAuthStore((s) => s.signedIn)
  const display = useDisplay()
  const [name, setName] = useState(me?.name ?? "")
  const [saving, setSaving] = useState(false)

  const trimmed = name.trim()
  const canSave = !saving && trimmed.length > 0 && trimmed.length <= 100 && trimmed !== me?.name

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    try {
      const next = await apiClient.patch<Me>("/auth/me", { name: trimmed })
      signedIn(next)
      toast.success("บันทึกชื่อแล้ว")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-5">
      <form onSubmit={save} className="grid gap-2">
        <label htmlFor="set-name" className="text-[14px] text-ink">
          ชื่อที่แสดง
        </label>
        <div className="flex gap-2">
          <input
            id="set-name"
            className="inp"
            value={name}
            maxLength={100}
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary shrink-0" disabled={!canSave}>
            บันทึก
          </button>
        </div>
        <p className="text-[13px] text-dim">
          อีเมล {me?.email} เปลี่ยนไม่ได้ เพราะผูกกับบัญชี Google
        </p>
      </form>
      <div className="hair" />
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

/** The body mounts per opening, so the name field starts from the saved name. */
export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="ตั้งค่า">
      {open ? <SettingsBody /> : null}
    </Modal>
  )
}
