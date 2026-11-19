/**
 * ยกโครงทั้งชั้นปีไปปีการศึกษาใหม่ — UC 2.9, index-q's modalCopyLevel. The
 * server decides which courses belong to the year by the programme's study
 * plan (POST /courses/copy-level/preview, writes nothing); the user ticks and
 * confirms (…/commit). Structure only: never students, scores or grades.
 */
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Modal } from "../../components/overlay/Sheet.tsx"
import type { CopyLevelInput, CopyLevelRow } from "./course.types.ts"
import { coursesApi } from "./courses.api.ts"
import { useCopyLevel } from "./useCourses.ts"

const termTh = (s: number) => (s === 3 ? "ภาคพิเศษ" : `ภาค ${s}`)
const TONE: Record<CopyLevelRow["notes"][number]["tone"], string> = {
  nil: "text-dim",
  warn: "text-warn",
  bad: "text-bad",
}
const REASON_TH = {
  EXISTS: "มีอยู่แล้ว",
  NO_ACCESS: "ไม่มีสิทธิ์",
  NO_TEACHER: "ไม่มีผู้สอนที่ใช้งานได้",
} as const

export function CopyLevel({ years, onClose }: { years: number[]; onClose: () => void }) {
  const newest = years.length ? Math.max(...years) : new Date().getFullYear() + 543
  const [st, setSt] = useState<CopyLevelInput>({ level: 1, fromYear: newest, toYear: newest + 1 })
  // Ticks the user changed; untouched rows follow the default (planned ✓, off-plan ✗).
  const [ticks, setTicks] = useState<Record<string, boolean>>({})
  const preview = useQuery({
    queryKey: ["courses", "copy-level", st],
    queryFn: () => coursesApi.copyLevelPreview(st),
  })
  const commit = useCopyLevel()

  const picked = useMemo(() => {
    const p = preview.data
    if (!p) return []
    const rows = [
      ...p.planned.map((r) => [r, true] as const),
      ...p.offPlan.map((r) => [r, false] as const),
    ]
    return rows
      .filter(([r, byDefault]) => !r.exists && (ticks[r.courseId] ?? byDefault))
      .map(([r]) => r.courseId)
  }, [preview.data, ticks])

  const change = (patch: Partial<CopyLevelInput>) => {
    const next = { ...st, ...patch }
    if (patch.fromYear !== undefined) next.toYear = patch.fromYear + 1
    setSt(next)
    setTicks({})
  }

  const go = () =>
    commit.mutate(
      { ...st, courseIds: picked },
      {
        onSuccess: ({ created, skipped }) => {
          toast.success(
            `คัดลอกปี ${st.level} ไปปีการศึกษา ${st.toYear} แล้ว ${created.length} รายวิชา` +
              (skipped.length
                ? ` · ข้าม ${skipped.length} (${[...new Set(skipped.map((s) => REASON_TH[s.reason]))].join(", ")})`
                : "") +
              " · ยังไม่มีรายชื่อและคะแนน",
          )
          onClose()
        },
        onError: (e) => toast.error(e.message),
      },
    )

  const yearOptions = [...new Set([...years, st.fromYear])].sort((a, b) => b - a)
  const line = (r: CopyLevelRow, byDefault: boolean) => (
    <label
      key={r.courseId}
      className={`flex items-start gap-3 border-b border-edge2 py-2 last:border-0 ${r.exists ? "opacity-60" : ""}`}
    >
      <input
        type="checkbox"
        className="mt-1"
        disabled={r.exists}
        checked={!r.exists && (ticks[r.courseId] ?? byDefault)}
        onChange={(e) => setTicks({ ...ticks, [r.courseId]: e.target.checked })}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] text-ink">
          <span className="tnum">{r.code}</span> · {r.name}
        </span>
        <span className="tnum block text-[13px] text-dim">
          {termTh(r.semester)}/{st.fromYear} → {termTh(r.semester)}/{st.toYear} · Sec {r.section}
        </span>
        {r.notes.map((n) => (
          <span key={n.text} className={`block text-[12.5px] leading-snug ${TONE[n.tone]}`}>
            {n.text}
          </span>
        ))}
      </span>
    </label>
  )

  const p = preview.data
  return (
    <Modal
      open
      onClose={onClose}
      title="ยกโครงทั้งชั้นปีไปปีการศึกษาใหม่"
      sub="คัดลอก CLO จุดประสงค์ กิจกรรม เกณฑ์ ช่วงเกรด และผู้สอน · ไม่คัดลอกนักศึกษา คะแนน และเกรด"
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={picked.length === 0 || commit.isPending}
            onClick={go}
          >
            {commit.isPending ? "กำลังคัดลอก…" : `คัดลอกที่เลือก (${picked.length})`}
          </button>
        </>
      }
    >
      <div className="mb-4 grid grid-cols-3 gap-3">
        <label className="text-[14px] text-ink2">
          <span className="mb-1.5 block">ชั้นปี</span>
          <select
            className="inp"
            value={st.level}
            onChange={(e) => change({ level: Number(e.target.value) as CopyLevelInput["level"] })}
          >
            {[1, 2, 3, 4].map((l) => (
              <option key={l} value={l}>
                ปี {l}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[14px] text-ink2">
          <span className="mb-1.5 block">จากปีการศึกษา</span>
          <select
            className="inp"
            value={st.fromYear}
            onChange={(e) => change({ fromYear: Number(e.target.value) })}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[14px] text-ink2">
          <span className="mb-1.5 block">ไปปีการศึกษา</span>
          <select
            className="inp"
            value={st.toYear}
            onChange={(e) => change({ toYear: Number(e.target.value) })}
          >
            {[st.fromYear + 1, st.fromYear + 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      {preview.isLoading ? (
        <div className="text-[14px] text-dim">กำลังโหลด…</div>
      ) : preview.isError ? (
        <div className="text-[14px] text-bad" role="alert">
          โหลดรายการไม่สำเร็จ — {preview.error.message} · ลองเปลี่ยนปีแล้วลองใหม่
        </div>
      ) : p ? (
        <>
          <div className="over mb-1">
            ตามแผนการเรียน ปี {st.level} · {p.planned.length} รายวิชา
          </div>
          {p.planned.length ? (
            p.planned.map((r) => line(r, true))
          ) : (
            <div className="py-2 text-[14px] text-dim">
              ปี {st.fromYear} ไม่มีวิชาของชั้นปีนี้ที่คุณเข้าถึงได้
            </div>
          )}
          {p.offPlan.length > 0 && (
            <>
              <div className="over mb-1 mt-4">นอกแผน เช่น วิชาเลือก · ติ๊กเองถ้าต้องการ</div>
              {p.offPlan.map((r) => line(r, false))}
            </>
          )}
          {p.missing.length > 0 && (
            <>
              <div className="over mb-1 mt-4">
                ในแผนแต่ปี {st.fromYear} ไม่ได้เปิด · {p.missing.length} รายวิชา
              </div>
              <div className="text-[13px] leading-relaxed text-dim">
                {p.missing.map((m) => `${m.code} ${m.name} (${termTh(m.semester)})`).join(" · ")} —
                ไม่มีโครงให้คัดลอก สร้างเองได้ที่ “สร้างรายวิชา”
              </div>
            </>
          )}
        </>
      ) : null}
    </Modal>
  )
}
