/**
 * FORMS.band: one grade of the ladder — its name and the lowest score that
 * earns it. The ladder is saved as a whole (PUT /grade-bands), so an edit sends
 * every band; the checks that need the other bands (no repeated name or floor,
 * a band at 0) run here and again on the server.
 */
import { useState } from "react"
import { toast } from "sonner"
import { Modal } from "../../components/overlay/Sheet.tsx"
import { Field } from "../../components/ui/Badges.tsx"
import type { Band, Grading } from "./grading.types.ts"
import { checkBands, withBand } from "./ladder.ts"
import { useSaveBands } from "./useGrading.ts"

export function BandForm({
  courseId,
  grading,
  band,
  onClose,
}: {
  courseId: string
  grading: Grading
  /** null = add. */
  band: Band | null
  onClose: () => void
}) {
  const unit = grading.gradeMethod === "NORM_REFERENCED" ? "T-score" : "ร้อยละ"
  const [grade, setGrade] = useState(band?.grade ?? "")
  const [min, setMin] = useState(band ? String(band.minValue) : "")
  const [errors, setErrors] = useState<{ grade?: string; min?: string }>({})
  const save = useSaveBands(courseId)
  const ladder = grading.bands.map(({ grade, minValue }) => ({ grade, minValue }))

  const submit = () => {
    const e: typeof errors = {}
    const n = Number(min)
    if (!grade.trim()) e.grade = "กรอกชื่อเกรด"
    else if (grade.trim().length > 4) e.grade = "ชื่อเกรดยาวเกิน 4 ตัวอักษร"
    if (min.trim() === "" || !Number.isFinite(n) || n < 0)
      e.min = "คะแนนเริ่มต้องเป็นตัวเลข 0 ขึ้นไป"
    setErrors(e)
    if (Object.keys(e).length) return
    const next = withBand(ladder, band?.grade ?? null, { grade: grade.trim(), minValue: n })
    const problem = checkBands(next, grading.gradeMethod)
    if (problem) {
      setErrors(/ชื่อ/.test(problem) ? { grade: problem } : { min: problem })
      return
    }
    save.mutate(
      { bands: next },
      {
        onSuccess: () => {
          toast.success(band ? "บันทึกระดับเกรดแล้ว" : "เพิ่มระดับเกรดแล้ว")
          onClose()
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  const isZero = band?.minValue === 0
  return (
    <Modal
      open
      onClose={onClose}
      title={band ? `แก้ไขระดับเกรด ${band.grade}` : "เพิ่มระดับเกรด"}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={save.isPending}
            onClick={submit}
          >
            บันทึก
          </button>
        </>
      }
    >
      <form
        className="grid grid-cols-2 gap-4"
        onSubmit={(ev) => {
          ev.preventDefault()
          submit()
        }}
      >
        <Field label="เกรด" htmlFor="b-grade" required error={errors.grade}>
          <input
            id="b-grade"
            className="inp"
            value={grade}
            placeholder="เช่น B+"
            onChange={(e) => {
              setGrade(e.target.value)
              setErrors((x) => ({ ...x, grade: undefined }))
            }}
          />
        </Field>
        <Field
          label={`คะแนนต่ำสุดของเกรดนี้ (${unit})`}
          htmlFor="b-min"
          required
          hint={isZero ? "ขั้นล่างสุดต้องเริ่มที่ 0 (CR-09)" : undefined}
          error={errors.min}
        >
          <input
            id="b-min"
            className="inp tnum"
            inputMode="decimal"
            value={min}
            disabled={isZero}
            onChange={(e) => {
              setMin(e.target.value)
              setErrors((x) => ({ ...x, min: undefined }))
            }}
          />
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
