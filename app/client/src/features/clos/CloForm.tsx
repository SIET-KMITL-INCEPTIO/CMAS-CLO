/**
 * FORMS.clo of index-q.html: number, planned weight (empty, with what is left
 * as the placeholder — U3), Bloom/SOLO source, text, Bloom, SOLO. With AUTO,
 * SOLO is locked and follows Bloom as it is chosen (O3).
 */
import { useState } from "react"
import { toast } from "sonner"
import { Modal } from "../../components/overlay/Sheet.tsx"
import { Field } from "../../components/ui/Badges.tsx"
import { ApiError } from "../../lib/apiClient.ts"
import { BLOOM, SOLO, type Bloom, type Clo, type CloInput, type Solo } from "./clo.types.ts"
import { BLOOM_TH, BLOOM_TO_SOLO, n2, SOLO_HINT, SOLO_TH, useSaveClo } from "./useClos.ts"

type Draft = {
  number: string
  weight: string
  levelSource: "AUTO" | "MANUAL"
  description: string
  bloomLevel: Bloom | ""
  soloLevel: Solo | ""
}
type Errors = Partial<Record<keyof Draft, string>>

export function CloForm({
  courseId,
  clo,
  all,
  onClose,
}: {
  courseId: string
  clo: Clo | null
  all: Clo[]
  onClose: () => void
}) {
  const others = all.reduce((t, c) => t + (clo && c.id === clo.id ? 0 : (c.weight ?? 0)), 0)
  const left = Math.max(0, 100 - others)
  const next = all.length ? Math.max(...all.map((c) => c.number)) + 1 : 1
  const [d, setD] = useState<Draft>(() => ({
    number: String(clo?.number ?? next),
    weight: clo?.weight === null || clo?.weight === undefined ? "" : String(clo.weight),
    levelSource: clo?.levelSource ?? "AUTO",
    description: clo?.description ?? "",
    bloomLevel: clo?.bloomLevel ?? "",
    soloLevel: clo?.soloLevel ?? "",
  }))
  const [errors, setErrors] = useState<Errors>({})
  const save = useSaveClo(courseId)
  const auto = d.levelSource === "AUTO"
  // O3 — with AUTO the SOLO box shows what Bloom gives, not what was stored.
  const solo: Solo | "" = auto ? (d.bloomLevel ? BLOOM_TO_SOLO[d.bloomLevel] : "") : d.soloLevel

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((x) => ({ ...x, [k]: v }))
    setErrors((x) => ({ ...x, [k]: undefined }))
  }

  const check = (): Errors => {
    const e: Errors = {}
    const num = Number(d.number)
    if (!d.description.trim()) e.description = "กรอกข้อความ CLO ก่อน"
    if (!Number.isInteger(num) || num < 1 || num > 99) e.number = "ลำดับต้องเป็นจำนวนเต็ม 1–99"
    else if (all.some((c) => c.number === num && c.id !== clo?.id))
      e.number = `มี CLO ลำดับ ${num} อยู่แล้วในรายวิชานี้`
    const w = Number(d.weight)
    if (d.weight.trim() === "") e.weight = `กรอกน้ำหนักตามแผนของ CLO นี้ (ที่เหลือ ${n2(left)}%)`
    else if (!Number.isFinite(w) || w < 0 || w > 100)
      e.weight = "น้ำหนักตามแผนต้องอยู่ระหว่าง 0–100"
    // The API needs a Bloom level to create a CLO; an existing one may still lack it (seeded data).
    if (!d.bloomLevel && (!clo || clo.bloomLevel)) e.bloomLevel = "เลือกระดับ Bloom"
    if (!auto && !d.soloLevel) e.soloLevel = "โหมดกำหนดเองต้องเลือกระดับ SOLO"
    return e
  }

  const submit = () => {
    const e = check()
    setErrors(e)
    if (Object.keys(e).length) return
    const body: CloInput = {
      number: Number(d.number),
      description: d.description.trim(),
      weight: Number(d.weight),
      levelSource: d.levelSource,
      ...(d.bloomLevel ? { bloomLevel: d.bloomLevel } : {}),
      // AUTO: the server derives SOLO and refuses one sent with it.
      ...(!auto && d.soloLevel ? { soloLevel: d.soloLevel } : {}),
    }
    save.mutate(
      { cloId: clo?.id ?? null, body },
      {
        onSuccess: () => {
          toast.success(clo ? "บันทึก CLO แล้ว" : "เพิ่ม CLO แล้ว")
          onClose()
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) setErrors({ number: err.message })
          else toast.error(err.message)
        },
      },
    )
  }

  const select = (
    id: string,
    value: string,
    onChange: (v: string) => void,
    options: [string, string][],
    disabled = false,
  ) => (
    <select
      id={id}
      className="inp"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  )

  return (
    <Modal
      open
      onClose={onClose}
      title={clo ? `แก้ไข CLO ${clo.number}` : "เพิ่ม CLO"}
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="ลำดับ (เลขข้อ)" htmlFor="f-number" required error={errors.number}>
            <input
              id="f-number"
              className="inp tnum"
              inputMode="numeric"
              value={d.number}
              onChange={(e) => set("number", e.target.value)}
              aria-invalid={errors.number ? true : undefined}
            />
          </Field>
          <Field
            label="น้ำหนักตามแผน (%)"
            htmlFor="f-weight"
            required
            hint={`CLO ข้ออื่นรวม ${n2(others)}% · เหลือ ${n2(left)}%`}
            error={errors.weight}
          >
            <input
              id="f-weight"
              className="inp tnum"
              inputMode="decimal"
              placeholder={`เหลือ ${n2(left)}`}
              value={d.weight}
              onChange={(e) => set("weight", e.target.value)}
              aria-invalid={errors.weight ? true : undefined}
            />
          </Field>
          <div className="col-span-2">
            <Field label="ระดับ Bloom / SOLO" htmlFor="f-source">
              {select(
                "f-source",
                d.levelSource,
                (v) => set("levelSource", v as Draft["levelSource"]),
                [
                  ["AUTO", "อัตโนมัติ — SOLO ตาม Bloom"],
                  ["MANUAL", "กำหนดเองทั้งสองระดับ"],
                ],
              )}
            </Field>
          </div>
        </div>
        <Field
          label="CLO (ผลลัพธ์การเรียนรู้ระดับรายวิชา)"
          htmlFor="f-desc"
          required
          error={errors.description}
        >
          <textarea
            id="f-desc"
            className="inp"
            rows={3}
            placeholder="เช่น ประยุกต์ใช้แผนภาพ UML เพื่อออกแบบระบบ"
            value={d.description}
            onChange={(e) => set("description", e.target.value)}
            aria-invalid={errors.description ? true : undefined}
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="ระดับ Bloom" htmlFor="f-bloom" required error={errors.bloomLevel}>
            {select("f-bloom", d.bloomLevel, (v) => set("bloomLevel", v as Draft["bloomLevel"]), [
              ["", "— ยังไม่ระบุ —"],
              ...BLOOM.map((k): [string, string] => [k, `${k} · ${BLOOM_TH[k]}`]),
            ])}
          </Field>
          <Field
            label="ระดับ SOLO"
            htmlFor="f-solo"
            hint={auto ? "ตามระดับ Bloom ให้เอง" : undefined}
            error={errors.soloLevel}
          >
            {select(
              "f-solo",
              solo,
              (v) => set("soloLevel", v as Draft["soloLevel"]),
              [
                ["", "— ยังไม่ระบุ —"],
                ...SOLO.map((k): [string, string] => [k, `${SOLO_TH[k]} · ${SOLO_HINT[k]}`]),
              ],
              auto,
            )}
          </Field>
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
