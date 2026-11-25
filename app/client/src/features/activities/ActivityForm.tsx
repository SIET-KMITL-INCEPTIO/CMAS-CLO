/**
 * FORMS.activity of index-q.html: name, type (+ a custom one), assessment
 * method (follows the type until changed), weight in the course, full score,
 * and which objectives the activity measures with its share of each (T4).
 * In GROUP mode there is no weight box: the group's weight decides it (N1).
 * "More" holds the pass score — shown only, never part of a CLO verdict (FR-47).
 */
import { useState } from "react"
import { toast } from "sonner"
import { Modal } from "../../components/overlay/Sheet.tsx"
import { Field } from "../../components/ui/Badges.tsx"
import { Combobox, type ComboOption } from "../../components/ui/Combobox.tsx"
import { ApiError } from "../../lib/apiClient.ts"
import { evenShares, n2, weightLeftHint } from "../clos/useClos.ts"
import type { Clo } from "../clos/clo.types.ts"
import type {
  Activity,
  ActivityInput,
  ActivityKind,
  ActivityListMeta,
  Criteria,
  Method,
} from "./activity.types.ts"
import { ACTIVITY_TYPES, METHODS } from "./activity.types.ts"
import {
  customKey,
  LABEL_MAX,
  linksUnchanged,
  parseChoice,
  validateActivity,
  type ActivityErrors,
} from "./activityValidation.ts"
import { DEFAULT_MAX, DEFAULT_METHOD, METHOD_TH, TYPE_TH } from "./activityView.ts"
import { ObjectivePicker } from "./ObjectivePicker.tsx"
import { useSaveActivity } from "./useActivities.ts"

export function ActivityForm({
  courseId,
  activity,
  activities,
  meta,
  clos,
  criteria,
  objectiveText,
  onClose,
}: {
  courseId: string
  activity: Activity | null
  activities: Activity[]
  meta: ActivityListMeta
  clos: Clo[]
  criteria: Criteria
  /** objectiveId → its description, for the checkboxes. */
  objectiveText: Map<string, string>
  onClose: () => void
}) {
  const byGroup = meta.weightMode === "GROUP"
  const others = activities.reduce((t, a) => t + (a.id === activity?.id ? 0 : a.weight), 0)
  const left = Math.max(0, 100 - others)
  const mine = criteria.cells.filter((c) => c.activityId === activity?.id)

  const startType = activity
    ? activity.type === "CUSTOM"
      ? `CUSTOM:${activity.typeLabel}`
      : activity.type
    : "TEST"
  const startMethod = activity
    ? activity.assessmentMethod === "CUSTOM"
      ? `CUSTOM:${activity.assessmentLabel}`
      : activity.assessmentMethod
    : "EXAM"
  const [name, setName] = useState(activity?.name ?? "")
  const [type, setType] = useState<string>(startType)
  const [method, setMethod] = useState<string>(startMethod)
  const [methodTouched, setMethodTouched] = useState(false)
  const [weight, setWeight] = useState(activity ? String(activity.weight) : "")
  const [maxScore, setMaxScore] = useState(String(activity?.maxScore ?? DEFAULT_MAX.TEST))
  const [maxTouched, setMaxTouched] = useState(false)
  const [passScore, setPassScore] = useState(activity ? String(activity.passScore) : "")
  const [ticked, setTicked] = useState<Record<string, string>>(() =>
    Object.fromEntries(mine.map((c) => [c.objectiveId, String(c.weight)])),
  )
  const [errors, setErrors] = useState<ActivityErrors>({})
  const save = useSaveActivity(courseId)

  const groups = clos
    .map((c) => ({ clo: c, objs: criteria.objectives.filter((o) => o.cloId === c.id) }))
    .filter((g) => g.objs.length)
  const hasObjectives = groups.length > 0
  const clear = (k: keyof ActivityErrors) => setErrors((x) => ({ ...x, [k]: undefined }))

  const pickType = (v: string) => {
    setType(v)
    const k = parseChoice<ActivityKind>(v).key
    // The method and the full score follow the type until the instructor sets them.
    if (!methodTouched && k !== "CUSTOM")
      setMethod(DEFAULT_METHOD[k as Exclude<ActivityKind, "CUSTOM">])
    if (!maxTouched && !activity) setMaxScore(String(DEFAULT_MAX[k]))
  }

  const toggle = (id: string) => {
    setErrors((x) => ({ ...x, links: undefined }))
    const keys = Object.keys(ticked)
    const next = keys.includes(id) ? keys.filter((k) => k !== id) : [...keys, id]
    // The set changed → an even split again (the sum must be 100).
    const shares = evenShares(next.length)
    setTicked(Object.fromEntries(next.map((k, i) => [k, String(shares[i])])))
  }

  const submit = () => {
    const e = validateActivity(
      { name, weight, maxScore, passScore, ticked },
      { byGroup, others, left, hasObjectives },
    )
    const t = parseChoice<ActivityKind>(type)
    const m = parseChoice<Method>(method)
    const max = Number(maxScore)
    const w = Number(weight)
    const links = Object.entries(ticked).map(([id, v]) => [id, Number(v)] as const)
    setErrors(e)
    if (Object.keys(e).length) return

    const body: ActivityInput = {
      name: name.trim(),
      type: t.key,
      ...(t.key === "CUSTOM" ? { typeLabel: t.label } : {}),
      assessmentMethod: m.key,
      ...(m.key === "CUSTOM" ? { assessmentLabel: m.label } : {}),
      maxScore: max,
      ...(passScore.trim() !== "" ? { passScore: Number(passScore) } : {}),
      ...(!byGroup ? { weight: w } : {}),
    }
    // Links are sent only when they changed: it costs a read and a replace of the whole matrix.
    const same = activity !== null && linksUnchanged(mine, links)
    save.mutate(
      {
        activityId: activity?.id ?? null,
        body,
        links: hasObjectives && !same ? Object.fromEntries(links) : null,
      },
      {
        onSuccess: () => {
          toast.success(activity ? "บันทึกกิจกรรมแล้ว" : "เพิ่มกิจกรรมแล้ว")
          onClose()
        },
        onError: (err) => {
          // 422 carries the rule's own words (weight over 100, scores above the new full score…).
          if (err instanceof ApiError && err.status === 422 && /คะแนนเต็ม/.test(err.message))
            setErrors({ maxScore: err.message })
          else if (
            err instanceof ApiError &&
            err.status === 422 &&
            /น้ำหนัก|กิจกรรมอื่น/.test(err.message)
          )
            setErrors({ weight: err.message })
          else toast.error(err.message)
        },
      },
    )
  }

  const typeOptions: ComboOption[] = [
    ...ACTIVITY_TYPES.filter((k) => k !== "CUSTOM").map((k) => ({
      key: k,
      label: TYPE_TH[k as keyof typeof TYPE_TH],
    })),
    ...meta.customTypes.map((l) => ({ key: customKey(l), label: l })),
  ]
  const methodOptions: ComboOption[] = [
    ...METHODS.filter((k) => k !== "CUSTOM").map((k) => ({
      key: k,
      label: METHOD_TH[k as keyof typeof METHOD_TH],
    })),
    ...meta.customMethods.map((l) => ({ key: customKey(l), label: l })),
  ]

  return (
    <Modal
      open
      onClose={onClose}
      title={activity ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรม"}
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
        <Field label="ชื่อกิจกรรม" htmlFor="a-name" required error={errors.name}>
          <input
            id="a-name"
            className="inp"
            placeholder="เช่น สอบปลายภาค"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              clear("name")
            }}
            aria-invalid={errors.name ? true : undefined}
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="ประเภทกิจกรรม" htmlFor="a-type">
            <Combobox
              id="a-type"
              value={type}
              options={typeOptions}
              onChange={pickType}
              create={customKey}
              maxLength={LABEL_MAX}
              placeholder="เลือก หรือพิมพ์ประเภทใหม่"
            />
          </Field>
          <Field label="วิธีประเมิน" htmlFor="a-method">
            <Combobox
              id="a-method"
              value={method}
              options={methodOptions}
              onChange={(v) => {
                setMethod(v)
                setMethodTouched(true)
              }}
              create={customKey}
              maxLength={LABEL_MAX}
              placeholder="เลือก หรือพิมพ์วิธีใหม่"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {byGroup ? (
            <Field
              label="ร้อยละของสัดส่วนคะแนนในวิชา"
              htmlFor="a-weight"
              hint="ตั้งที่หัวกลุ่มในตาราง"
            >
              <div id="a-weight" className="inp tnum !bg-wash text-dim">
                {activity ? `${n2(activity.weight)}% (จากน้ำหนักกลุ่ม)` : "จากน้ำหนักกลุ่ม"}
              </div>
            </Field>
          ) : (
            <Field
              label="ร้อยละของสัดส่วนคะแนนในวิชา"
              htmlFor="a-weight"
              required
              hint={weightLeftHint(others)}
              error={errors.weight}
            >
              <input
                id="a-weight"
                className="inp tnum"
                inputMode="decimal"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value)
                  clear("weight")
                }}
                aria-invalid={errors.weight ? true : undefined}
              />
            </Field>
          )}
          <Field label="คะแนนเต็ม" htmlFor="a-max" required error={errors.maxScore}>
            <input
              id="a-max"
              className="inp tnum"
              inputMode="decimal"
              value={maxScore}
              onChange={(e) => {
                setMaxScore(e.target.value)
                setMaxTouched(true)
                clear("maxScore")
              }}
              aria-invalid={errors.maxScore ? true : undefined}
            />
          </Field>
        </div>

        {hasObjectives && (
          <ObjectivePicker
            groups={groups}
            ticked={ticked}
            objectiveText={objectiveText}
            error={errors.links}
            onToggle={toggle}
            onShare={(id, value) => {
              setTicked((x) => ({ ...x, [id]: value }))
              clear("links")
            }}
          />
        )}

        <div className="hair-t pt-4">
          <div className="over mb-2.5">เพิ่มเติม (ไม่บังคับ)</div>
          <Field
            label="คะแนนที่ถือว่าผ่านกิจกรรมนี้"
            htmlFor="a-pass"
            hint="เว้นว่าง = 50% ของคะแนนเต็ม · ใช้ดูภาพรวมเท่านั้น ไม่มีผลต่อคำตัดสิน CLO"
            error={errors.passScore}
          >
            <input
              id="a-pass"
              className="inp tnum"
              inputMode="decimal"
              value={passScore}
              onChange={(e) => {
                setPassScore(e.target.value)
                clear("passScore")
              }}
              aria-invalid={errors.passScore ? true : undefined}
            />
          </Field>
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
