/**
 * นักศึกษาและคะแนน — viewRoster of index-q.html: the roster and the scores are
 * one table (T5). Adding, editing, withdrawing (R2: out of every denominator,
 * scores kept, reversible) and deleting a student happen here; so does
 * everything that touches a score. The total (%) column waits for the
 * class-wide results endpoint (G3, issue #33): a total is an attainment
 * number and has one calculation, on the server (FR-88).
 */
import { useState } from "react"
import { toast } from "sonner"
import { Modal } from "../../components/overlay/Sheet.tsx"
import { useCan } from "../../hooks/useCan.ts"
import { ConfirmDelete } from "../clos/ConfirmDelete.tsx"
import { CoursePage } from "../courses/CoursePage.tsx"
import { useCourseContext } from "../courses/useCourseContext.ts"
import type { GridStudent } from "../scores/score.types.ts"
import { ChangesDrawer } from "../scores/ChangesDrawer.tsx"
import { ImportExcel } from "../scores/ImportExcel.tsx"
import { scoresApi } from "../scores/scores.api.ts"
import { ScoreGrid } from "../scores/ScoreGrid.tsx"
import { useScoreGrid } from "../scores/useScores.ts"
import { StudentForm } from "./StudentForm.tsx"
import { studentsApi } from "./students.api.ts"
import { useDeleteStudent, useRestoreStudent, useWithdrawStudent } from "./useStudents.ts"

const TITLE = "นักศึกษาและคะแนน"

export default function Roster() {
  const { course } = useCourseContext()
  const can = useCan(course)
  const [page, setPage] = useState(1)
  const grid = useScoreGrid(course.id, page)
  const [form, setForm] = useState<GridStudent | "new" | null>(null)
  const [deleting, setDeleting] = useState<GridStudent | null>(null)
  const [excel, setExcel] = useState(false)
  const [importing, setImporting] = useState<"roster" | "scores" | null>(null)
  const [history, setHistory] = useState(false)
  const withdraw = useWithdrawStudent()
  const restore = useRestoreStudent()
  const remove = useDeleteStudent()

  const data = grid.data
  const failed = (err: Error) => toast.error(err.message)
  const canManage = can("student.write")
  const total = data?.meta.total ?? 0
  const pages = Math.max(1, Math.ceil(total / (data?.meta.perPage ?? 200)))

  const addButton = (
    <>
      {canManage && (
        <button type="button" className="btn btn-primary" onClick={() => setForm("new")}>
          เพิ่มนักศึกษา
        </button>
      )}
      {(can("score.import") || can("score.export") || canManage) && (
        <button type="button" className="btn" onClick={() => setExcel(true)}>
          Excel
        </button>
      )}
      <button type="button" className="btn" onClick={() => setHistory(true)}>
        ประวัติการแก้
      </button>
    </>
  )
  const help = (
    <>
      หนึ่งแถวคือหนึ่งการลงทะเบียน · ช่องว่าง = ยังไม่ประเมิน ไม่ใช่ 0 ·
      ถอนรายวิชาแล้วคะแนนเดิมยังอยู่และคืนสถานะได้
    </>
  )

  let body
  if (grid.isLoading) body = <div className="text-[14px] text-dim">กำลังโหลด…</div>
  else if (!data) body = null
  else if (data.students.length === 0)
    body = (
      <div className="card px-6 py-10 text-center">
        <div className="text-[16px] text-ink">ยังไม่มีรายชื่อนักศึกษา</div>
        <div className="mt-1.5 text-[14px] text-dim">เพิ่มทีละคนในตาราง</div>
        {canManage && (
          <button type="button" className="btn btn-primary mt-4" onClick={() => setForm("new")}>
            เพิ่มนักศึกษา
          </button>
        )}
      </div>
    )
  else if (data.activities.length === 0)
    body = (
      <div className="card px-6 py-10 text-center">
        <div className="text-[16px] text-ink">
          {data.students.length} คน · ยังไม่มีกิจกรรมให้กรอกคะแนน
        </div>
        <div className="mt-1.5 text-[14px] text-dim">
          สร้างกิจกรรมก่อน แล้วกลับมากรอกคะแนนที่นี่
        </div>
      </div>
    )
  else
    body = (
      <>
        <ScoreGrid
          courseId={course.id}
          grid={data}
          canEdit={can("score.edit")}
          canManage={canManage}
          actions={{
            edit: setForm,
            withdraw: (s) =>
              withdraw.mutate(s.id, {
                onSuccess: () =>
                  toast.success(`${s.studentCode} ถอนรายวิชาแล้ว — คะแนนเดิมยังอยู่`),
                onError: failed,
              }),
            restore: (s) =>
              restore.mutate(s.id, {
                onSuccess: () => toast.success(`${s.studentCode} กลับเข้ารายวิชาแล้ว`),
                onError: failed,
              }),
            remove: setDeleting,
          }}
        />
        {pages > 1 && (
          <div className="no-print mt-3 flex items-center gap-2 text-[14px]">
            <button
              type="button"
              className="btn"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              ‹ ก่อนหน้า
            </button>
            <span className="tnum">
              หน้า {page} / {pages} · {total} คน
            </span>
            <button
              type="button"
              className="btn"
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
            >
              ถัดไป ›
            </button>
          </div>
        )}
      </>
    )

  return (
    <CoursePage title={TITLE} tools={addButton} help={help}>
      {body}
      {excel && (
        <Modal
          open
          onClose={() => setExcel(false)}
          title="นำเข้า / ส่งออก Excel"
          sub="ตรวจไฟล์ก่อนบันทึกเสมอ — ยังไม่เขียนอะไรจนกว่าจะยืนยัน"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {can("score.export") && (
              <>
                <button
                  type="button"
                  className="btn"
                  onClick={() => studentsApi.template(course.id).catch(failed)}
                >
                  ดาวน์โหลดเทมเพลตรายชื่อ
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => scoresApi.template(course.id).catch(failed)}
                >
                  ดาวน์โหลดเทมเพลตคะแนน
                </button>
              </>
            )}
            {canManage && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setExcel(false)
                  setImporting("roster")
                }}
              >
                นำเข้ารายชื่อ
              </button>
            )}
            {can("score.import") && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setExcel(false)
                  setImporting("scores")
                }}
              >
                นำเข้าคะแนน
              </button>
            )}
          </div>
        </Modal>
      )}
      {importing && (
        <ImportExcel kind={importing} courseId={course.id} onClose={() => setImporting(null)} />
      )}
      {history && <ChangesDrawer courseId={course.id} onClose={() => setHistory(false)} />}
      {form && (
        <StudentForm
          courseId={course.id}
          student={form === "new" ? null : form}
          onClose={() => setForm(null)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          title={`ลบนักศึกษา — ${deleting.studentCode} ${deleting.name}`}
          label="ลบนักศึกษา"
          rows={[["แถวคะแนน", Object.values(deleting.scores).filter((v) => v !== null).length]]}
          note="การลงทะเบียนในรายวิชาอื่นของรหัสเดียวกันจะไม่ถูกแตะต้อง · ถ้าแค่ไม่เรียนแล้วให้ใช้ “ถอน” แทน — คะแนนเดิมจะยังอยู่"
          pending={remove.isPending}
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            remove.mutate(deleting.id, {
              onSuccess: () => {
                toast.success(`ลบ ${deleting.studentCode} แล้ว`)
                setDeleting(null)
              },
              onError: failed,
            })
          }
        />
      )}
    </CoursePage>
  )
}
