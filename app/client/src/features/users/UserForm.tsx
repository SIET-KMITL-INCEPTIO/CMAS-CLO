/**
 * แก้ไขบัญชี (UC 1.2, 1.4): name and system role. The server refuses — with
 * a sentence that says what to do instead — changing your own role, removing
 * the last active ADMIN, and making an instructor of a course an ADMIN (D-1).
 */
import { useState } from "react"
import { toast } from "sonner"
import { Modal } from "../../components/overlay/Sheet.tsx"
import { Field } from "../../components/ui/Badges.tsx"
import type { Role, User } from "../../types/user.types.ts"
import { ROLE_TH } from "./userView.ts"
import { useUpdateUser } from "./useUsers.ts"

export function UserForm({
  user,
  self,
  onClose,
}: {
  user: User
  self: boolean
  onClose: () => void
}) {
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState<Role>(user.role)
  const [error, setError] = useState<string | null>(null)
  const update = useUpdateUser()

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return setError("กรอกชื่อ")
    const body = {
      ...(trimmed !== user.name ? { name: trimmed } : {}),
      ...(role !== user.role ? { role } : {}),
    }
    if (Object.keys(body).length === 0) return onClose()
    update.mutate(
      { id: user.id, ...body },
      {
        onSuccess: () => {
          toast.success("บันทึกแล้ว")
          onClose()
        },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="แก้ไขบัญชีผู้ใช้"
      sub={user.email}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={update.isPending}
            onClick={submit}
          >
            บันทึก
          </button>
        </>
      }
    >
      <form
        className="grid grid-cols-1 gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Field label="ชื่อ-สกุล" htmlFor="u-name" required error={error}>
          <input
            id="u-name"
            className="inp"
            value={name}
            maxLength={100}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            aria-invalid={error ? true : undefined}
          />
        </Field>
        <Field
          label="บทบาทระบบ"
          htmlFor="u-role"
          hint={
            self
              ? "เปลี่ยนบทบาทของตัวเองไม่ได้"
              : "ผู้ดูแลระบบเห็นทุกรายวิชาแต่ไม่ทำงานสอน — ผู้สอนที่ยังอยู่ในรายวิชาต้องถูกเอาออกก่อน"
          }
        >
          <select
            id="u-role"
            className="inp"
            value={role}
            disabled={self}
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
