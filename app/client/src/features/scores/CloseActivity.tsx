/**
 * Closing an activity (R3): the empty cells of enrolled students must be
 * decided, because after closing a blank means "missed", not "not assessed yet".
 * Each choice is recorded as a score change by the server (A-12).
 */
import { useState } from "react"
import { toast } from "sonner"
import { Modal } from "../../components/overlay/Sheet.tsx"
import { Field } from "../../components/ui/Badges.tsx"
import type { CloseBlank, GridActivity } from "./score.types.ts"
import { useCloseActivity } from "./useScores.ts"

const CHOICES: { value: CloseBlank; label: string; hint: string }[] = [
  {
    value: "LATER",
    label: "ปล่อยว่างไว้",
    hint: "ยังไม่ประเมิน — กลับมากรอกได้หลังเปิดรับคะแนนอีกครั้ง",
  },
  { value: "ZERO", label: "ให้ 0 คะแนน", hint: "ขาดส่ง — ช่องว่างของทุกคนที่ลงทะเบียนอยู่เป็น 0" },
  { value: "EXCUSED", label: "ยกเว้น", hint: "ไม่นับกิจกรรมนี้ให้คนที่ยังว่าง — ต้องมีเหตุผล" },
]

export function CloseActivity({
  activity,
  blanks,
  onClose,
}: {
  activity: GridActivity
  /** Empty cells of enrolled students right now. */
  blanks: number
  onClose: () => void
}) {
  const [blank, setBlank] = useState<CloseBlank>("LATER")
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const close = useCloseActivity()

  const submit = () => {
    if (blank === "EXCUSED" && !reason.trim()) {
      setError("การยกเว้นต้องมีเหตุผล")
      return
    }
    close.mutate(
      { activityId: activity.id, blank, ...(blank === "EXCUSED" ? { reason: reason.trim() } : {}) },
      {
        onSuccess: () => {
          toast.success(`ปิดรับคะแนน ${activity.name} แล้ว`)
          onClose()
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`ปิดรับคะแนน — ${activity.name}`}
      sub={blanks ? `ยังมี ${blanks} ช่องว่างของนักศึกษาที่ลงทะเบียนอยู่` : "ทุกช่องมีค่าแล้ว"}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={close.isPending}
            onClick={submit}
          >
            ปิดรับคะแนน
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {blanks > 0 && (
          <fieldset className="space-y-2">
            <legend className="mb-1 text-[14px] text-ink2">ช่องที่ยังว่างให้เป็น</legend>
            {CHOICES.map((c) => (
              <label key={c.value} className="flex items-start gap-2.5 text-[14px]">
                <input
                  type="radio"
                  name="blank"
                  className="mt-1"
                  checked={blank === c.value}
                  onChange={() => setBlank(c.value)}
                />
                <span>
                  {c.label}
                  <span className="block text-[13px] text-dim">{c.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
        )}
        {blank === "EXCUSED" && blanks > 0 && (
          <Field label="เหตุผล" htmlFor="ex-reason" required error={error}>
            <input
              id="ex-reason"
              className="inp"
              placeholder="เช่น ลาป่วย มีใบรับรองแพทย์"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError(null)
              }}
            />
          </Field>
        )}
        <p className="text-[13px] text-dim">
          เปิดรับคะแนนอีกครั้งได้ภายหลัง — 0 และการยกเว้นที่ตั้งตอนปิดจะยังอยู่
        </p>
      </div>
    </Modal>
  )
}
