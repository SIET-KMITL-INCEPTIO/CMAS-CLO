/**
 * modalGrading of index-q.html: the scale (A–F or ผ่าน/ไม่ผ่าน), the method
 * (อิงเกณฑ์ or อิงกลุ่ม) and, where the ladder cannot imply it, the course pass
 * mark. S/U cannot be graded on a curve (CR-10), so that choice is off as soon
 * as S/U is picked. Changing scale or method starts the ladder again from the
 * default one; a frozen course refuses it until it is unfrozen.
 */
import { useState } from "react"
import { toast } from "sonner"
import { Modal } from "../../components/overlay/Sheet.tsx"
import { Field } from "../../components/ui/Badges.tsx"
import { n2 } from "../clos/useClos.ts"
import { METHOD_TH, SCALE_TH } from "../courses/courseView.ts"
import type { Grading, GradeMethod, GradeScale } from "./grading.types.ts"
import { defaultBands } from "./ladder.ts"
import { useSaveBands } from "./useGrading.ts"

const HELP: Record<GradeScale | GradeMethod, string> = {
  LETTER:
    "ได้เกรด A · B+ · B · C+ · C · D+ · D · F ตามคะแนนรวม — แก้คะแนนต่ำสุดของแต่ละเกรดได้ในตารางขั้นบันได",
  PASS_FAIL:
    "ไม่มีเกรด A–F · ถึงเกณฑ์ผ่านคือ ผ่าน (S) ต่ำกว่าคือ ไม่ผ่าน (U) · เหมาะกับวิชาฝึกปฏิบัติหรือ 0 หน่วยกิต",
  CRITERION_REFERENCED: "ตัดตามคะแนนที่ตั้งไว้ — ใครถึงเกณฑ์ก็ได้เกรดนั้น ไม่ขึ้นกับคะแนนเพื่อน",
  NORM_REFERENCED: "ตัดโดยเทียบกับเพื่อนในกลุ่ม (T-score) — ใช้ได้กับ A–F เท่านั้น",
}

export function GradingSettings({
  courseId,
  grading,
  onClose,
}: {
  courseId: string
  grading: Grading
  onClose: () => void
}) {
  const [scale, setScale] = useState<GradeScale>(grading.gradeScale)
  const [method, setMethod] = useState<GradeMethod>(grading.gradeMethod)
  const [pass, setPass] = useState(String(grading.passCriteria))
  const [error, setError] = useState<string | null>(null)
  const save = useSaveBands(courseId)

  const effective: GradeMethod = scale === "PASS_FAIL" ? "CRITERION_REFERENCED" : method
  const ladderSaysPass = scale === "LETTER" && effective === "CRITERION_REFERENCED"
  const changed = scale !== grading.gradeScale || effective !== grading.gradeMethod

  const submit = () => {
    const passNumber = Number(pass)
    if (
      !ladderSaysPass &&
      (pass.trim() === "" || !Number.isFinite(passNumber) || passNumber < 0 || passNumber > 100)
    ) {
      setError("เกณฑ์ผ่านต้องอยู่ระหว่าง 0–100")
      return
    }
    const current = grading.bands.map(({ grade, minValue }) => ({ grade, minValue }))
    save.mutate(
      {
        gradeScale: scale,
        gradeMethod: effective,
        // A–F อิงเกณฑ์ derives the pass mark from the ladder; sending it is refused.
        ...(ladderSaysPass ? {} : { passCriteria: passNumber }),
        bands: changed ? defaultBands(scale, effective, passNumber) : current,
      },
      {
        onSuccess: () => {
          toast.success("บันทึกการตั้งค่าแล้ว")
          onClose()
        },
        onError: (err) => setError(err.message),
      },
    )
  }

  const choice = <K extends string>(
    name: string,
    value: K,
    cur: K,
    label: string,
    onPick: (k: K) => void,
    off = false,
  ) => (
    <label
      key={value}
      className={`hair flex cursor-pointer items-start gap-3 rounded-lg p-3 ${off ? "opacity-50" : ""}`}
    >
      <input
        type="radio"
        name={name}
        className="mt-1"
        checked={cur === value && !off}
        disabled={off}
        onChange={() => onPick(value)}
      />
      <span>
        <span className="block text-[14px] text-ink">{label}</span>
        <span className="mt-0.5 block text-[13px] leading-relaxed text-dim">
          {HELP[value as GradeScale | GradeMethod]}
        </span>
      </span>
    </label>
  )

  return (
    <Modal
      open
      onClose={onClose}
      title="ตั้งค่าการตัดเกรด"
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
      <div className="space-y-5">
        <fieldset>
          <legend className="mb-1.5 text-[14px] text-ink2">รูปแบบเกรด</legend>
          <div className="space-y-2">
            {(["LETTER", "PASS_FAIL"] as const).map((k) =>
              choice("g-scale", k, scale, SCALE_TH[k], setScale),
            )}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1.5 text-[14px] text-ink2">วิธีตัดเกรด</legend>
          <div className="space-y-2">
            {(["CRITERION_REFERENCED", "NORM_REFERENCED"] as const).map((k) =>
              choice(
                "g-method",
                k,
                effective,
                METHOD_TH[k],
                setMethod,
                k === "NORM_REFERENCED" && scale === "PASS_FAIL",
              ),
            )}
          </div>
        </fieldset>
        {ladderSaysPass ? (
          <div>
            <div className="mb-1.5 text-[14px] text-ink2">เกณฑ์ผ่านรายวิชา</div>
            <div className="rounded-lg bg-wash px-4 py-3 text-[14px] leading-relaxed text-ink2">
              ตั้งตามขั้นบันไดเกรดโดยอัตโนมัติ — เกรดต่ำสุดที่ยังผ่าน (ตอนนี้{" "}
              <b className="tnum">{n2(grading.passCriteria)}%</b>) แก้ได้ที่ขั้นบันไดเกรด
            </div>
          </div>
        ) : (
          <Field
            label="เกณฑ์ผ่านรายวิชา (% ของคะแนนรวม)"
            htmlFor="g-pass"
            hint="คะแนนรวมขั้นต่ำที่ผ่านรายวิชา (ไม่ใช่เกณฑ์ผ่านของ CLO ที่วัดทีละข้อ)"
          >
            <input
              id="g-pass"
              className="inp tnum"
              inputMode="decimal"
              value={pass}
              onChange={(e) => {
                setPass(e.target.value)
                setError(null)
              }}
            />
          </Field>
        )}
        {changed && (
          <div className="text-[13px] text-warn">
            ถ้าเปลี่ยนรูปแบบเกรด ขั้นบันไดเกรดจะกลับเป็นค่าเริ่มต้น
          </div>
        )}
        {error && <div className="ferr">{error}</div>}
      </div>
    </Modal>
  )
}
