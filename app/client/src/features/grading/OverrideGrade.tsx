/**
 * modalOverride of index-q.html: change the grade that is issued for one
 * student, with the reason — always. Without a reason an instructor would edit
 * the raw scores instead, and every CLO figure would move with it. The grade
 * the scores give stays visible; "ยกเลิกการปรับ" goes back to it.
 */
import { useState } from "react"
import { toast } from "sonner"
import { Modal } from "../../components/overlay/Sheet.tsx"
import { Field } from "../../components/ui/Badges.tsx"
import { n2 } from "../clos/useClos.ts"
import type { Grading, GradingStudent } from "./grading.types.ts"
import { useClearOverride, useOverride } from "./useGrading.ts"

export function OverrideGrade({
  grading,
  student,
  onClose,
}: {
  grading: Grading
  student: GradingStudent
  onClose: () => void
}) {
  const ladder = grading.gradeScale === "PASS_FAIL" ? ["S", "U"] : grading.bands.map((b) => b.grade)
  const [grade, setGrade] = useState(student.issuedGrade ?? ladder[0]!)
  const [reason, setReason] = useState(student.overrideReason ?? "")
  const [error, setError] = useState<string | null>(null)
  const override = useOverride()
  const clear = useClearOverride()
  const busy = override.isPending || clear.isPending

  const save = () => {
    if (!reason.trim()) {
      setError("ต้องใส่เหตุผลการปรับเกรด")
      return
    }
    override.mutate(
      { studentId: student.studentId, grade, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("บันทึกการปรับเกรดแล้ว")
          onClose()
        },
        onError: (err) => setError(err.message),
      },
    )
  }
  const undo = () =>
    clear.mutate(student.studentId, {
      onSuccess: () => {
        toast.success("ยกเลิกการปรับเกรดแล้ว")
        onClose()
      },
      onError: (err) => setError(err.message),
    })

  return (
    <Modal
      open
      onClose={onClose}
      title={`ปรับเกรด — ${student.name}`}
      sub={student.studentCode}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          {student.overrideReason && (
            <button type="button" className="btn" disabled={busy} onClick={undo}>
              ยกเลิกการปรับ
            </button>
          )}
          <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>
            บันทึกการปรับเกรด
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="over">เกรดตามคะแนน</div>
            <div className="tnum mt-1 text-[22px]">{student.derivedGrade ?? "—"}</div>
          </div>
          <div>
            <div className="over">คะแนนรวม</div>
            <div className="tnum mt-1 text-[22px]">
              {student.totalPercent === null ? "—" : `${n2(student.totalPercent)}%`}
            </div>
          </div>
        </div>
        <Field label="เกรดที่จะออกจริง" htmlFor="o-grade">
          <select
            id="o-grade"
            className="inp"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          >
            {ladder.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="เหตุผลการปรับ"
          htmlFor="o-reason"
          required
          hint="ถ้าไม่มีเหตุผลกำกับ อาจารย์จะไปแก้คะแนนดิบแทน ซึ่งทำให้ตัวเลข CLO ทั้งหมดเปลี่ยนตามไปด้วย"
          error={error}
        >
          <textarea
            id="o-reason"
            className="inp"
            rows={3}
            placeholder="เช่น ประเมินคะแนนโครงงานใหม่หลังการอุทธรณ์"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setError(null)
            }}
            aria-invalid={error ? true : undefined}
          />
        </Field>
      </div>
    </Modal>
  )
}
