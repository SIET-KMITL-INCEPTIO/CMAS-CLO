/**
 * FORMS.objective of index-q.html: which CLO, number, weight within the CLO
 * (empty, with what is left as the placeholder — U3), text. An objective stays
 * under the CLO it was made in: the API does not move one between CLOs.
 */
import { useState } from "react"
import { toast } from "sonner"
import { Modal } from "../../components/overlay/Sheet.tsx"
import { Field } from "../../components/ui/Badges.tsx"
import { ApiError } from "../../lib/apiClient.ts"
import type { Clo, Objective } from "./clo.types.ts"
import { n2, useSaveObjective } from "./useClos.ts"

type Errors = Partial<Record<"number" | "weight" | "description", string>>

export function ObjectiveForm({
  objective,
  cloId: startClo,
  clos,
  objectivesOf,
  onClose,
}: {
  objective: Objective | null
  cloId: string
  clos: Clo[]
  objectivesOf: (cloId: string) => Objective[]
  onClose: () => void
}) {
  const [cloId, setCloId] = useState(objective?.cloId ?? startClo)
  const sibs = objectivesOf(cloId)
  const others = sibs.reduce((t, o) => t + (o.id === objective?.id ? 0 : (o.weight ?? 0)), 0)
  const left = Math.max(0, 100 - others)
  const next = sibs.length ? Math.max(...sibs.map((o) => o.number)) + 1 : 1
  const [number, setNumber] = useState(String(objective?.number ?? next))
  const [weight, setWeight] = useState(
    objective?.weight === null || objective?.weight === undefined ? "" : String(objective.weight),
  )
  const [description, setDescription] = useState(objective?.description ?? "")
  const [errors, setErrors] = useState<Errors>({})
  const save = useSaveObjective()
  const clo = clos.find((c) => c.id === cloId)

  const submit = () => {
    const e: Errors = {}
    const num = Number(number)
    const w = Number(weight)
    if (!description.trim()) e.description = "กรอกข้อความจุดประสงค์ก่อน"
    if (!Number.isInteger(num) || num < 1 || num > 99) e.number = "ลำดับต้องเป็นจำนวนเต็ม 1–99"
    else if (sibs.some((o) => o.number === num && o.id !== objective?.id))
      e.number = "มีจุดประสงค์ลำดับนี้อยู่แล้วภายใต้ CLO เดียวกัน"
    if (weight.trim() === "") e.weight = "กรอกน้ำหนักของจุดประสงค์นี้ใน CLO (ดูยอดที่เหลือใต้ช่อง)"
    else if (!Number.isFinite(w) || w <= 0 || w > 100)
      e.weight = "น้ำหนักใน CLO ต้องมากกว่า 0 และไม่เกิน 100"
    setErrors(e)
    if (Object.keys(e).length) return
    save.mutate(
      {
        objectiveId: objective?.id ?? null,
        cloId,
        body: { number: num, weight: w, description: description.trim() },
      },
      {
        onSuccess: () => {
          toast.success(objective ? "บันทึกจุดประสงค์แล้ว" : "เพิ่มจุดประสงค์แล้ว")
          onClose()
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) setErrors({ number: err.message })
          else toast.error(err.message)
        },
      },
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={objective ? "แก้ไขจุดประสงค์เชิงพฤติกรรม" : "เพิ่มจุดประสงค์เชิงพฤติกรรม"}
      sub={clo ? `CLO ${clo.number} · ${clo.description}` : undefined}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={save.isPending}
          >
            บันทึก
          </button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Field label="อยู่ใต้ CLO" htmlFor="f-clo">
          <select
            id="f-clo"
            className="inp"
            value={cloId}
            disabled={objective !== null}
            onChange={(e) => {
              setCloId(e.target.value)
              const s = objectivesOf(e.target.value)
              setNumber(String(s.length ? Math.max(...s.map((o) => o.number)) + 1 : 1))
            }}
          >
            {clos.map((c) => (
              <option key={c.id} value={c.id}>
                CLO {c.number} · {c.description.slice(0, 48)}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ลำดับ (เลขข้อ)" htmlFor="f-onum" required error={errors.number}>
            <input
              id="f-onum"
              className="inp tnum"
              inputMode="numeric"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              aria-invalid={errors.number ? true : undefined}
            />
          </Field>
          <Field
            label="น้ำหนักใน CLO (%)"
            htmlFor="f-oweight"
            required
            hint={`ข้ออื่นใต้ CLO นี้รวม ${n2(others)}% · เหลือ ${n2(left)}%`}
            error={errors.weight}
          >
            <input
              id="f-oweight"
              className="inp tnum"
              inputMode="decimal"
              placeholder={`เหลือ ${n2(left)}`}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              aria-invalid={errors.weight ? true : undefined}
            />
          </Field>
        </div>
        <Field
          label="จุดประสงค์ (พฤติกรรมที่วัดได้)"
          htmlFor="f-odesc"
          required
          error={errors.description}
        >
          <textarea
            id="f-odesc"
            className="inp"
            rows={2}
            placeholder="เช่น เขียน Use Case Diagram จากโจทย์ที่กำหนด"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={errors.description ? true : undefined}
          />
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
