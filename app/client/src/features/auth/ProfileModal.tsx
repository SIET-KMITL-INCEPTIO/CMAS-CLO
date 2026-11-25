/**
 * "บัญชีของฉัน" — modalProfile() of index-q.html (UC 9.1, FR-119). The owner
 * edits their own name. Email, role and status are shown, never offered:
 * the email is how they sign in (PATCH /auth/me takes the name only), and
 * role and status are the admin's to set — a form that shows a control you
 * may not use is worse than one that does not show it.
 */
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Modal } from "../../components/overlay/Sheet.tsx"
import { Field } from "../../components/ui/Badges.tsx"
import { apiClient } from "../../lib/apiClient.ts"
import { ROLE_TH, type Me } from "../../types/user.types.ts"
import { NAME_MAX, nameError } from "./profile.ts"
import { useAuthStore } from "./useAuthStore.ts"

function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-wash px-4 py-3">
      <div className="over mb-1">{label}</div>
      <div className="tnum text-[14px] text-ink">{value}</div>
      {sub && <div className="mt-1 text-[12.5px] text-dim">{sub}</div>}
    </div>
  )
}

function ProfileBody({ me, onClose }: { me: Me; onClose: () => void }) {
  const signedIn = useAuthStore((s) => s.signedIn)
  const queryClient = useQueryClient()
  const [name, setName] = useState(me.name)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const e = nameError(name)
    setError(e)
    if (e || saving) return
    const next = name.trim()
    if (next === me.name) {
      toast("ไม่มีอะไรเปลี่ยน")
      return onClose()
    }
    setSaving(true)
    try {
      signedIn(await apiClient.patch<Me>("/auth/me", { name: next }))
      // The name shows on the users page and in its history too.
      void queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("บันทึกชื่อแล้ว")
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const admin = me.role === "ADMIN"
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <Field label="ชื่อ-สกุล" htmlFor="pf-name" required error={error}>
        <input
          id="pf-name"
          className="inp"
          value={name}
          maxLength={NAME_MAX}
          autoComplete="name"
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
        />
      </Field>
      <Field label="อีเมล" htmlFor="pf-email" hint="ใช้เข้าสู่ระบบ จึงแก้ไม่ได้">
        <div id="pf-email" className="inp tnum truncate !bg-wash text-dim">
          {me.email}
        </div>
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Fact label="บทบาท" value={ROLE_TH[me.role]} />
        {admin ? (
          <Fact label="รายวิชาที่ดูแล" value="ทุกรายวิชา" />
        ) : (
          <Fact
            label="รายวิชาที่ดูแล"
            value={`${me.courseCount} รายวิชา`}
            sub="เห็นเฉพาะรายวิชาเหล่านี้"
          />
        )}
      </div>
      <p className="text-[13px] text-dim">บทบาทและสถานะบัญชีแก้ได้โดยผู้ดูแลระบบเท่านั้น</p>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn" onClick={onClose}>
          ยกเลิก
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          บันทึก
        </button>
      </div>
    </form>
  )
}

/** The body mounts per opening, so the name field starts from the saved name. */
export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const me = useAuthStore((s) => s.me)
  return (
    <Modal open={open} onClose={onClose} title="บัญชีของฉัน">
      {open && me ? <ProfileBody me={me} onClose={onClose} /> : null}
    </Modal>
  )
}
