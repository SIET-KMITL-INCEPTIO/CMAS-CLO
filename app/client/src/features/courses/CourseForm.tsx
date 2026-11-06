/**
 * modalCourse of index-q.html — create a course, or edit its settings and
 * staff. Grading settings are not here: they belong to the grading page,
 * where the CLOs and activities they judge are in view (mockup F2).
 *
 * ADMIN does no teaching work (D-1): editing, they see only the staff list.
 */
import { useState } from "react"
import { toast } from "sonner"
import { Field } from "../../components/ui/Badges.tsx"
import { Icon } from "../../components/Icon.tsx"
import { Modal } from "../../components/overlay/Sheet.tsx"
import { useCan } from "../../hooks/useCan.ts"
import { ApiError } from "../../lib/apiClient.ts"
import { useAuthStore } from "../auth/useAuthStore.ts"
import type { Course, CourseInput } from "./course.types.ts"
import { useCreateCourse, useInstructorSearch, useSaveCourse } from "./useCourses.ts"

type Staff = { userId: string; name: string; email?: string }
type Draft = Record<keyof CourseInput, string>

const toDraft = (c: Course): Draft => ({
  code: c.code,
  name: c.name,
  nameEn: c.nameEn ?? "",
  semester: String(c.semester),
  year: String(c.year),
  section: c.section,
  credits: String(Number(c.credits)),
  lectureHours: String(Number(c.lectureHours)),
  practiceHours: String(Number(c.practiceHours)),
  selfStudyHours: String(Number(c.selfStudyHours)),
})

const blank = (term: { semester: number; year: number }): Draft => ({
  code: "",
  name: "",
  nameEn: "",
  semester: String(term.semester),
  year: String(term.year),
  section: "01",
  credits: "3",
  lectureHours: "0",
  practiceHours: "0",
  selfStudyHours: "0",
})

const NUMERIC = ["credits", "lectureHours", "practiceHours", "selfStudyHours"] as const

/** Checks the browser can make before the server does it again (U5: the error sits under its field). */
function check(d: Draft) {
  const e: Partial<Record<keyof Draft, string>> = {}
  if (!d.code.trim()) e.code = "กรอกรหัสวิชา"
  if (!d.name.trim()) e.name = "กรอกชื่อรายวิชา"
  const y = Number(d.year)
  if (!Number.isInteger(y) || y < 2500 || y > 2600) e.year = "ปี พ.ศ. 2500–2600"
  if (!/^\d{2}$/.test(d.section) || d.section === "00") e.section = "ตัวเลข 2 หลัก เช่น 01"
  for (const k of NUMERIC) {
    const n = Number(d[k])
    if (d[k].trim() === "" || !Number.isFinite(n) || n < 0) e[k] = "ตัวเลข 0 ขึ้นไป"
    else if (Math.round(n * 10) !== n * 10) e[k] = "ทศนิยมได้ 1 ตำแหน่ง"
  }
  return e
}

const toInput = (d: Draft): CourseInput => ({
  code: d.code.trim(),
  name: d.name.trim(),
  nameEn: d.nameEn.trim() || null,
  semester: Number(d.semester),
  year: Number(d.year),
  section: d.section,
  credits: Number(d.credits),
  lectureHours: Number(d.lectureHours),
  practiceHours: Number(d.practiceHours),
  selfStudyHours: Number(d.selfStudyHours),
})

export function CourseForm({
  course,
  term,
  onClose,
  onCreated,
  onDelete,
}: {
  /** null = create. */
  course: Course | null
  term: { semester: number; year: number }
  onClose: () => void
  onCreated?: (c: Course) => void
  onDelete?: (c: Course) => void
}) {
  const me = useAuthStore((s) => s.me)
  const can = useCan(course)
  const editing = course !== null
  // ADMIN on an existing course: staff only (course.settings is for the teachers).
  const settings = !editing || can("course.settings")

  const [d, setD] = useState<Draft>(() => (course ? toDraft(course) : blank(term)))
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  // An instructor creating a course teaches it (FR-22c) — the server adds them; showing it says so.
  const [staff, setStaff] = useState<Staff[]>(() =>
    course
      ? course.instructors.map((i) => ({ userId: i.userId, name: i.name }))
      : me?.role === "INSTRUCTOR"
        ? [{ userId: me.id, name: me.name }]
        : [],
  )
  const [q, setQ] = useState("")
  const hits = useInstructorSearch(q)
  const create = useCreateCourse()
  const save = useSaveCourse()
  const busy = create.isPending || save.isPending

  const set = (k: keyof Draft) => (e: { target: { value: string } }) => {
    setD((x) => ({ ...x, [k]: e.target.value }))
    setErrors((x) => ({ ...x, [k]: undefined }))
  }

  const input = (
    k: keyof Draft,
    label: string,
    opts: { required?: boolean; numeric?: boolean } = {},
  ) => (
    <Field label={label} htmlFor={`f-${k}`} required={opts.required} error={errors[k]}>
      <input
        id={`f-${k}`}
        className={`inp ${opts.numeric ? "tnum" : ""}`}
        value={d[k]}
        onChange={set(k)}
        inputMode={opts.numeric ? "decimal" : undefined}
        aria-invalid={errors[k] ? true : undefined}
        disabled={!settings}
      />
    </Field>
  )

  const fail = (err: unknown) => {
    if (err instanceof ApiError && err.status === 409) {
      setErrors((x) => ({ ...x, section: err.message }))
      return
    }
    setFormError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง")
  }

  const submit = () => {
    setFormError(null)
    const e = settings ? check(d) : {}
    setErrors(e)
    if (Object.keys(e).length) return
    if (!course) {
      create.mutate(
        { ...toInput(d), instructors: staff.map((s) => ({ userId: s.userId })) },
        {
          onSuccess: (c) => {
            toast.success(`สร้าง ${c.code} Sec ${c.section} แล้ว`)
            onCreated?.(c)
          },
          onError: fail,
        },
      )
      return
    }
    const before = new Set(course.instructors.map((i) => i.userId))
    const after = new Set(staff.map((s) => s.userId))
    const draft = toInput(d)
    const orig = toInput(toDraft(course))
    const changed = Object.fromEntries(
      (Object.keys(draft) as (keyof CourseInput)[])
        .filter((k) => draft[k] !== orig[k])
        .map((k) => [k, draft[k]]),
    ) as Partial<CourseInput>
    save.mutate(
      {
        courseId: course.id,
        body: settings && Object.keys(changed).length ? changed : null,
        add: [...after].filter((id) => !before.has(id)),
        remove: [...before].filter((id) => !after.has(id)),
      },
      {
        onSuccess: () => {
          toast.success("บันทึกแล้ว")
          onClose()
        },
        onError: fail,
      },
    )
  }

  const onStaff = new Set(staff.map((s) => s.userId))
  const results = (hits.data ?? []).filter((h) => !onStaff.has(h.id))

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? `ตั้งค่ารายวิชา — ${course.code} Sec ${course.section}` : "สร้างรายวิชา"}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>
            {editing ? "บันทึกการแก้ไข" : "สร้างรายวิชา"}
          </button>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        {settings ? (
          <>
            <div className="text-[13px] text-dim">
              <span className="text-bad">*</span> = ต้องกรอก
            </div>
            <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-3">
              {input("code", "รหัสวิชา", { required: true, numeric: true })}
              {input("name", "ชื่อรายวิชา (ไทย)", { required: true })}
            </div>
            {input("nameEn", "ชื่อรายวิชา (อังกฤษ)")}
            <div className="grid grid-cols-3 gap-3">
              <Field label="ภาคการศึกษา" htmlFor="f-semester">
                <select
                  id="f-semester"
                  className="inp"
                  value={d.semester}
                  onChange={set("semester")}
                >
                  {[1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
              {input("year", "ปีการศึกษา (พ.ศ.)", { required: true, numeric: true })}
              {input("section", "Sec", { numeric: true })}
            </div>
            <div className="hair-t pt-4">
              <div className="over mb-2.5">
                หน่วยกิตและชั่วโมง{" "}
                <span className="tracking-normal text-faint normal-case">· ชั่วโมงต่อสัปดาห์</span>
              </div>
              <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-4">
                {input("credits", "หน่วยกิต", { numeric: true })}
                {input("lectureHours", "บรรยาย", { numeric: true })}
                {input("practiceHours", "ปฏิบัติ", { numeric: true })}
                {input("selfStudyHours", "ศึกษาเอง", { numeric: true })}
              </div>
            </div>
          </>
        ) : (
          <div className="text-[14px] text-dim">{course?.name}</div>
        )}

        <div className={settings ? "hair-t pt-4" : ""}>
          <div className="over mb-1.5">ผู้สอนประจำรายวิชา</div>
          {staff.length === 0 ? (
            <div className="text-[13px] text-dim">ยังไม่มีผู้สอน — ค้นหาด้านล่างเพื่อเพิ่ม</div>
          ) : (
            <ul className="space-y-1">
              {staff.map((s) => {
                const self = s.userId === me?.id
                return (
                  <li key={s.userId} className="flex items-center gap-2 text-[14px]">
                    <span className="min-w-0 flex-1 truncate">
                      {s.name}
                      {s.email && <span className="text-[13px] text-dim"> · {s.email}</span>}
                      {self && <span className="text-[13px] text-dim"> (คุณ)</span>}
                    </span>
                    {/* S-9: nobody removes themselves; a teacher creating a course teaches it (FR-22c). */}
                    {!self && (
                      <button
                        type="button"
                        className="btn btn-quiet !px-2 !py-0.5"
                        onClick={() => setStaff((x) => x.filter((y) => y.userId !== s.userId))}
                        aria-label={`เอา ${s.name} ออก`}
                      >
                        เอาออก
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          <div className="relative mt-2">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dim">
              <Icon name="search" className="h-4 w-4" />
            </span>
            <input
              className="inp !pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
              placeholder="ค้นหาผู้สอนด้วยชื่อหรืออีเมล เพื่อเพิ่ม"
              aria-label="ค้นหาผู้สอน"
            />
          </div>
          {q.trim() && (
            <div className="mt-1.5">
              {!hits.data ? (
                <div className="text-[13px] text-dim">กำลังค้นหา…</div>
              ) : results.length === 0 ? (
                <div className="text-[13px] text-dim">ไม่พบผู้สอนที่ตรงกัน</div>
              ) : (
                <ul className="space-y-0.5">
                  {results.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        className="w-full rounded-sm px-2 py-1.5 text-left text-[14px] hover:bg-wash"
                        onClick={() => {
                          setStaff((x) => [...x, { userId: h.id, name: h.name, email: h.email }])
                          setQ("")
                        }}
                      >
                        {h.name} <span className="text-[13px] text-dim">· {h.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {formError && <div className="ferr">{formError}</div>}

        {editing && onDelete && can("course.delete") && (
          <div className="hair-t pt-4">
            <button type="button" className="btn btn-danger" onClick={() => onDelete(course)}>
              ลบรายวิชานี้
            </button>
          </div>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
