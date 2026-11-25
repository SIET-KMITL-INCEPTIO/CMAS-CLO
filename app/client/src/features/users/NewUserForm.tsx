/**
 * เพิ่มบัญชี (UC 1.1, 1.4): an ADMIN makes an account before its owner's
 * first sign-in. It is ACTIVE at once and has no password — the owner opens
 * it with Google or an email link, both of which find it by email.
 */
import { useState } from "react"
import { toast } from "sonner"
import { Modal } from "../../components/overlay/Sheet.tsx"
import { Field } from "../../components/ui/Badges.tsx"
import { ROLE_TH, type Role } from "../../types/user.types.ts"
import { useCreateUser } from "./useUsers.ts"

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

type Errors = { email?: string; name?: string }

export function NewUserForm({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<Role>("INSTRUCTOR")
  const [errors, setErrors] = useState<Errors>({})
  const create = useCreateUser()

  const submit = () => {
    const next: Errors = {}
    const to = email.trim().toLowerCase()
    if (!EMAIL_RE.test(to)) next.email = "กรอกอีเมลให้ถูกต้อง เช่น name@kmitl.ac.th"
    if (!name.trim()) next.name = "กรอกชื่อ-สกุล"
    setErrors(next)
    if (next.email || next.name) return
    create.mutate(
      { email: to, name: name.trim(), role },
      {
        onSuccess: (u) => {
          toast.success(
            `เพิ่มบัญชี ${u.name} แล้ว · เข้าสู่ระบบด้วย Google หรือลิงก์ทางอีเมลได้ทันที`,
          )
          onClose()
        },
        // 409 names the fix ("ค้นหาแล้วแก้ไขบัญชีเดิมแทน"); keep it beside the field.
        onError: (e) => setErrors({ email: e.message }),
      },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="เพิ่มบัญชีผู้ใช้"
      sub="ใช้งานได้ทันที ไม่มีรหัสผ่าน"
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={create.isPending}
            onClick={submit}
          >
            {create.isPending ? "กำลังเพิ่ม…" : "เพิ่มบัญชี"}
          </button>
        </>
      }
    >
      <form
        className="grid grid-cols-1 gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Field label="อีเมล" htmlFor="nu-email" required error={errors.email ?? null}>
          <input
            id="nu-email"
            className="inp"
            type="email"
            autoComplete="off"
            value={email}
            placeholder="name@kmitl.ac.th"
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((x) => ({ ...x, email: undefined }))
            }}
            aria-invalid={errors.email ? true : undefined}
          />
        </Field>
        <Field label="ชื่อ-สกุล" htmlFor="nu-name" required error={errors.name ?? null}>
          <input
            id="nu-name"
            className="inp"
            value={name}
            maxLength={100}
            onChange={(e) => {
              setName(e.target.value)
              setErrors((x) => ({ ...x, name: undefined }))
            }}
            aria-invalid={errors.name ? true : undefined}
          />
        </Field>
        <Field label="บทบาทระบบ" htmlFor="nu-role" hint="ผู้ดูแลระบบเห็นทุกรายวิชาแต่ไม่ทำงานสอน">
          <select
            id="nu-role"
            className="inp"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="INSTRUCTOR">{ROLE_TH.INSTRUCTOR}</option>
            <option value="ADMIN">{ROLE_TH.ADMIN}</option>
          </select>
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
