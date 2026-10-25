/**
 * FORMS.student of index-q.html: a student is an enrolment, not a person — the
 * same code can sit in several courses (ASM-01). Adding keeps the form open
 * ("บันทึกแล้วเพิ่มต่อ") so a roster can be typed in one go.
 */
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Modal } from "../../components/overlay/Sheet.tsx"
import { Field } from "../../components/ui/Badges.tsx"
import { ApiError } from "../../lib/apiClient.ts"
import { useAddStudent, useEditStudent } from "./useStudents.ts"

type Errors = Partial<Record<"studentCode" | "name", string>>

export function StudentForm({
  courseId,
  student,
  onClose,
}: {
  courseId: string
  /** null = add. */
  student: { id: string; studentCode: string; name: string } | null
  onClose: () => void
}) {
  const [code, setCode] = useState(student?.studentCode ?? "")
  const [name, setName] = useState(student?.name ?? "")
  const [errors, setErrors] = useState<Errors>({})
  const codeBox = useRef<HTMLInputElement>(null)
  const add = useAddStudent(courseId)
  const edit = useEditStudent()
  const busy = add.isPending || edit.isPending

  const submit = (again: boolean) => {
    const e: Errors = {}
    if (!code.trim()) e.studentCode = "กรอกรหัสนักศึกษาก่อน"
    else if (code.trim().length > 20) e.studentCode = "รหัสยาวเกิน 20 ตัวอักษร"
    if (!name.trim()) e.name = "กรอกชื่อ-สกุลก่อน"
    setErrors(e)
    if (Object.keys(e).length) return
    const body = { studentCode: code.trim(), name: name.trim() }
    const done = () => {
      toast.success(student ? "บันทึกแล้ว" : `เพิ่ม ${body.studentCode} แล้ว`)
      if (again && !student) {
        setCode("")
        setName("")
        codeBox.current?.focus()
      } else onClose()
    }
    const fail = (err: Error) => {
      // 409: the code is already on this course (unique per course).
      if (err instanceof ApiError && err.status === 409) setErrors({ studentCode: err.message })
      else toast.error(err.message)
    }
    if (student) edit.mutate({ studentId: student.id, body }, { onSuccess: done, onError: fail })
    else add.mutate(body, { onSuccess: done, onError: fail })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={student ? "แก้ไขข้อมูลนักศึกษา" : "เพิ่มนักศึกษาเข้ารายวิชา"}
      sub="หนึ่งแถวคือหนึ่งการลงทะเบียน — รหัสเดียวกันลงทะเบียนได้หลายรายวิชา"
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          {!student && (
            <button type="button" className="btn" disabled={busy} onClick={() => submit(true)}>
              บันทึกแล้วเพิ่มต่อ
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => submit(false)}
          >
            บันทึก
          </button>
        </>
      }
    >
      <form
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          submit(false)
        }}
      >
        <Field label="รหัสนักศึกษา" htmlFor="st-code" required error={errors.studentCode}>
          <input
            id="st-code"
            ref={codeBox}
            className="inp tnum"
            placeholder="เช่น 6604101013"
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              setErrors((x) => ({ ...x, studentCode: undefined }))
            }}
            aria-invalid={errors.studentCode ? true : undefined}
          />
        </Field>
        <Field label="ชื่อ-สกุล" htmlFor="st-name" required error={errors.name}>
          <input
            id="st-name"
            className="inp"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setErrors((x) => ({ ...x, name: undefined }))
            }}
            aria-invalid={errors.name ? true : undefined}
          />
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
