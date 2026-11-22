/**
 * การตัดเกรด — viewGrading of index-q.html. Every number on this page comes
 * from the server (totals, T-scores, the grade the scores give): grading has
 * one calculation (FR-88). "ประมวลผลเกรด" freezes the grades (CR-11) — scores
 * edited afterwards do not move them until it is run again — and the page says
 * so wherever a frozen grade and today's scores disagree.
 */
import { PageState } from "../../components/page/PageState.tsx"
import { useState } from "react"
import { toast } from "sonner"
import { useCan } from "../../hooks/useCan.ts"
import { ConfirmDelete } from "../clos/ConfirmDelete.tsx"
import { CoursePage } from "../courses/CoursePage.tsx"
import { useCourseContext } from "../courses/useCourseContext.ts"
import { BandForm } from "./BandForm.tsx"
import { BandsTable } from "./BandsTable.tsx"
import { gradingApi } from "./grading.api.ts"
import type { Band, GradingBand, GradingStudent } from "./grading.types.ts"
import { GradingMethodCard } from "./GradingMethodCard.tsx"
import { GradingNotices } from "./GradingNotices.tsx"
import { GradingSettings } from "./GradingSettings.tsx"
import { freezeNote } from "./gradingView.ts"
import { withBand } from "./ladder.ts"
import { OverrideGrade } from "./OverrideGrade.tsx"
import { StudentGradesTable } from "./StudentGradesTable.tsx"
import { useGrading, useRunGrading, useSaveBands, useUnfreeze } from "./useGrading.ts"

export default function Grading() {
  const { course } = useCourseContext()
  const can = useCan(course)
  const q = useGrading(course.id)
  const g = q.data
  const run = useRunGrading(course.id)
  const unfreeze = useUnfreeze(course.id)
  const saveBands = useSaveBands(course.id)
  const [settings, setSettings] = useState(false)
  const [band, setBand] = useState<Band | "new" | null>(null)
  const [override, setOverride] = useState<GradingStudent | null>(null)
  const [confirmUnfreeze, setConfirmUnfreeze] = useState(false)
  const [sort, setSort] = useState<"desc" | "asc">("desc")
  const failed = (err: Error) => toast.error(err.message)

  const students = g?.students ?? []
  const enrolled = students.filter((s) => s.status === "ENROLLED")
  const withdrawn = students.filter((s) => s.status === "WITHDRAWN")
  const incomplete = enrolled.filter((s) => !s.complete).length

  const sorted = [...students].sort((a, b) => {
    const d = (b.totalPercent ?? -1) - (a.totalPercent ?? -1)
    return sort === "desc" ? d : -d
  })

  const runGrading = () =>
    run.mutate(undefined, {
      onSuccess: (r) =>
        toast.success(
          `ตรึงเกรดแล้ว ${r.issued} คน${r.skipped ? ` · ข้าม ${r.skipped} คนที่คะแนนไม่ครบ` : ""}`,
        ),
      onError: failed,
    })

  const removeBand = (b: GradingBand) => {
    if (!g) return
    saveBands.mutate(
      {
        bands: withBand(
          g.bands.map(({ grade, minValue }) => ({ grade, minValue })),
          b.grade,
          null,
        ),
      },
      { onSuccess: () => toast.success(`ลบระดับเกรด ${b.grade} แล้ว`), onError: failed },
    )
  }

  const tools = g && (
    <>
      {can("band.write") && (
        <button type="button" className="btn" onClick={() => setSettings(true)}>
          ตั้งค่าการตัดเกรด
        </button>
      )}
      {can("results.export") && (
        <button
          type="button"
          className="btn"
          onClick={() => gradingApi.export(course.id).catch(failed)}
        >
          ส่งออกผลการเรียน
        </button>
      )}
      {can("grading.run") && (
        <button
          type="button"
          className="btn btn-primary"
          disabled={run.isPending}
          onClick={runGrading}
        >
          ประมวลผลเกรด
        </button>
      )}
    </>
  )
  const help = (
    <>
      “ประมวลผลเกรด” ตรึงเกรดไว้ — แก้คะแนนภายหลังเกรดจะไม่เปลี่ยนจนกว่าจะประมวลผลใหม่ ·
      การปรับเกรดต้องมีเหตุผลเสมอและยกเลิกได้
    </>
  )

  let body
  if (q.isLoading || q.error || !g)
    body = (
      <PageState
        loading={q.isLoading}
        error={q.error}
        onRetry={() => void q.refetch()}
        empty={!q.isLoading && !q.error && !g}
        emptyState={
          <div className="card px-6 py-10 text-center text-[14px] text-dim">
            ยังไม่มีข้อมูลการตัดเกรดของรายวิชานี้ — ตั้งค่า CLO กิจกรรม และคะแนนก่อน
          </div>
        }
        what="การตัดเกรด"
      >
        {null}
      </PageState>
    )
  else
    body = (
      <>
        <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
          <GradingMethodCard g={g} />
          <BandsTable
            g={g}
            canWrite={can("band.write")}
            saving={saveBands.isPending}
            onNew={() => setBand("new")}
            onEdit={setBand}
            onRemove={removeBand}
          />
        </div>
        <GradingNotices
          g={g}
          incomplete={incomplete}
          withdrawn={withdrawn}
          note={freezeNote(g, students)}
          canRun={can("grading.run")}
          onUnfreeze={() => setConfirmUnfreeze(true)}
        />
        <StudentGradesTable
          g={g}
          rows={sorted}
          sort={sort}
          canOverride={can("grade.override")}
          onSort={() => setSort(sort === "desc" ? "asc" : "desc")}
          onOverride={setOverride}
        />
      </>
    )

  return (
    <CoursePage title="การตัดเกรด" tools={tools} help={help}>
      {body}
      {g && settings && (
        <GradingSettings courseId={course.id} grading={g} onClose={() => setSettings(false)} />
      )}
      {g && band && (
        <BandForm
          courseId={course.id}
          grading={g}
          band={band === "new" ? null : band}
          onClose={() => setBand(null)}
        />
      )}
      {g && override && (
        <OverrideGrade grading={g} student={override} onClose={() => setOverride(null)} />
      )}
      {confirmUnfreeze && (
        <ConfirmDelete
          title="ยกเลิกการตรึงเกรด"
          label="ยกเลิกการตรึง"
          warning="เกรดที่ตรึงไว้จะถูกล้าง — เกรดจะเปลี่ยนตามคะแนนอีกครั้งจนกว่าจะประมวลผลใหม่"
          rows={[
            ["เกรดที่ตรึงไว้", students.filter((s) => s.issuedGrade).length],
            ["เกรดที่ปรับเอง (ไปด้วย)", students.filter((s) => s.overrideReason).length],
          ]}
          note="เกรดที่ออกจะกลับไปเปลี่ยนตามคะแนนอีกครั้ง · การปรับเกรดทั้งหมดและเหตุผลจะหายด้วย"
          pending={unfreeze.isPending}
          onClose={() => setConfirmUnfreeze(false)}
          onConfirm={() =>
            unfreeze.mutate(undefined, {
              onSuccess: () => {
                toast.success("ยกเลิกการตรึงเกรดแล้ว")
                setConfirmUnfreeze(false)
              },
              onError: failed,
            })
          }
        />
      )}
    </CoursePage>
  )
}
