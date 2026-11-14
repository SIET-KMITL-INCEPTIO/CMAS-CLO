/**
 * confirmDelete('course') of index-q.html: what the delete takes with it
 * (GET /impact, FR-26), then a phrase typed by hand before the button wakes
 * up (J3). The server deletes only with ?confirm=true.
 */
import { useState } from "react"
import { toast } from "sonner"
import { Modal } from "../../components/overlay/Sheet.tsx"
import { TONE } from "../../components/ui/tone.ts"
import type { Course, CourseImpact } from "./course.types.ts"
import { deletePhrase } from "./courseView.ts"
import { useCourseImpact, useDeleteCourse } from "./useCourses.ts"

const ROWS: [keyof CourseImpact, string][] = [
  ["clos", "ผลลัพธ์การเรียนรู้ (CLO)"],
  ["objectives", "จุดประสงค์เชิงพฤติกรรม"],
  ["activities", "กิจกรรม"],
  ["criteria", "การเชื่อมกิจกรรมกับจุดประสงค์"],
  ["students", "รายชื่อนักศึกษา"],
  ["scores", "แถวคะแนน"],
  ["uploadLogs", "ประวัติการนำเข้าไฟล์"],
  ["remediationPlans", "แผนช่วยเหลือนักศึกษา"],
]

export function DeleteCourse({
  course,
  onClose,
  onDeleted,
}: {
  course: Course
  onClose: () => void
  onDeleted: (c: Course) => void
}) {
  const impact = useCourseImpact(course.id)
  const remove = useDeleteCourse()
  const [typed, setTyped] = useState("")
  const phrase = deletePhrase(course)
  // The reader sees what goes before the button wakes up.
  const ok = typed.trim() === phrase && Boolean(impact.data)
  const any = impact.data ? ROWS.some(([k]) => impact.data[k] > 0) : false

  const go = () => {
    if (!ok || remove.isPending) return
    remove.mutate(course.id, {
      onSuccess: () => {
        toast.success("ลบรายวิชาแล้ว")
        onDeleted(course)
      },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`ลบรายวิชา — ${course.code} Sec ${course.section}`}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn btn-solid-danger"
            onClick={go}
            disabled={!ok || remove.isPending}
          >
            ลบรายวิชา
          </button>
        </>
      }
    >
      <div
        className="mb-4 rounded-lg px-4 py-3 text-[14px]"
        style={{ background: TONE.bad.bg, color: TONE.bad.tx }}
      >
        {!impact.data
          ? "การลบนี้ย้อนกลับไม่ได้"
          : any
            ? "การลบนี้ย้อนกลับไม่ได้ และข้อมูลที่ผูกอยู่จะถูกลบตามไปด้วย"
            : "การลบนี้ย้อนกลับไม่ได้ — ยังไม่มีข้อมูลอื่นผูกอยู่"}
      </div>
      {impact.isLoading ? (
        <div className="text-[14px] text-dim">กำลังนับข้อมูลที่ผูกอยู่…</div>
      ) : impact.data ? (
        <table className="dt">
          <tbody>
            {ROWS.map(([k, label]) => (
              <tr key={k}>
                <td className="text-[14px]">{label}</td>
                <td className={`num tnum text-[14px] ${impact.data[k] ? "text-bad" : "text-dim"}`}>
                  {impact.data[k]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <form
        className="hair-t mt-5 pt-4"
        onSubmit={(e) => {
          e.preventDefault()
          go()
        }}
      >
        <label className="mb-1.5 block text-[14px] text-ink2" htmlFor="del-phrase">
          พิมพ์{" "}
          <code
            className="tnum rounded-xs px-1.5 py-0.5 text-ink select-all"
            style={{ background: "var(--tint)" }}
          >
            {phrase}
          </code>{" "}
          เพื่อยืนยัน
        </label>
        <input
          id="del-phrase"
          className="inp tnum"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="off"
        />
      </form>
    </Modal>
  )
}
