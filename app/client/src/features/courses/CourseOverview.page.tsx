/**
 * ภาพรวมรายวิชา — viewOverview of index-q.html: the course's one summary page.
 * Who passed the course, who passed each CLO, how each activity went, how the
 * totals spread, and who needs following up. All of it from one call,
 * /dashboard/summary, which computes every verdict and count from one snapshot
 * on the server. A score not yet entered is never a 0 (FR-84).
 */
import { useState } from "react"
import { Stat } from "../../components/page/Blocks.tsx"
import { PageState } from "../../components/page/PageState.tsx"
import { useCan } from "../../hooks/useCan.ts"
import { n2 } from "../clos/useClos.ts"
import { StudentDrawer } from "../dashboard/StudentDrawer.tsx"
import { useCourseSummary } from "../dashboard/useDashboard.ts"
import { CloAttainmentCard } from "./CloAttainmentCard.tsx"
import { CourseForm } from "./CourseForm.tsx"
import { CoursePage } from "./CoursePage.tsx"
import { FollowUpTable } from "./FollowUpTable.tsx"
import { OverviewCharts } from "./OverviewCharts.tsx"
import { attainmentState } from "./overviewView.ts"
import { useCourseContext } from "./useCourseContext.ts"

export default function CourseOverview() {
  const { course } = useCourseContext()
  const can = useCan(course)
  // One request, one snapshot on the server: attainment, follow-up list, totals, activities.
  const q = useCourseSummary(course.id)
  const [student, setStudent] = useState<string | null>(null)
  const [settings, setSettings] = useState(false)

  const sum = q.data
  const a = sum && { ...sum.attainment.data, meta: sum.attainment.meta }
  const passCriteria = sum?.course.passCriteria ?? 0
  const enrolledCount = sum?.course.enrolledCount ?? 0
  const completeCount = sum?.course.completeCount ?? 0
  const passing = sum?.course.passedCount ?? 0
  const totals = sum?.course.totals ?? []
  const rows = sum?.atRisk.data ?? []
  const nFail = rows.filter((r) => r.level === "COURSE_FAIL").length
  const nClo = rows.filter((r) => r.level === "CLO_BELOW").length
  const nOver = rows.filter((r) => r.level === "OVERDUE").length
  const nInc = sum?.atRisk.meta.notEvaluatedCount ?? 0
  const { locked, noScores } = attainmentState(a)

  const loading = q.isLoading

  return (
    <CoursePage
      title="ภาพรวมรายวิชา"
      tools={
        can("course.settings") && (
          <button type="button" className="btn" onClick={() => setSettings(true)}>
            ตั้งค่ารายวิชา
          </button>
        )
      }
      help={
        <>
          ผลสรุปของทั้งชั้น · เป้าหมายคือทุกคนผ่านทุก CLO จึงนับจำนวนคนที่ยังไม่ผ่าน ·
          คะแนนที่ยังไม่มีไม่ถูกนับเป็น 0
        </>
      }
    >
      {loading || q.error ? (
        <PageState loading={loading} error={q.error} onRetry={() => void q.refetch()} what="ภาพรวม">
          {null}
        </PageState>
      ) : (
        <>
          <div className="statbar mb-4">
            <Stat
              label="ผ่านรายวิชา"
              value={completeCount ? `${n2((passing / completeCount) * 100)}%` : "—"}
              sub={
                completeCount
                  ? `${passing}/${completeCount} คนที่คะแนนครบ · เกณฑ์ ${n2(passCriteria)}%`
                  : "ยังไม่มีคะแนนครบ"
              }
            />
            <Stat
              label="คะแนนรวมเฉลี่ย"
              value={
                totals.length ? `${n2(totals.reduce((t, v) => t + v, 0) / totals.length)}%` : "—"
              }
              sub={
                totals.length
                  ? `สูงสุด ${n2(Math.max(...totals))} · ต่ำสุด ${n2(Math.min(...totals))}`
                  : "ยังไม่มีคะแนนครบ"
              }
            />
            <Stat
              label="นักศึกษาที่ต้องติดตาม"
              value={enrolledCount ? `${rows.length} / ${enrolledCount}` : "—"}
              sub={
                enrolledCount === 0
                  ? "ยังไม่มีรายชื่อ"
                  : (rows.length
                      ? `ไม่ผ่านรายวิชา ${nFail} · ต่ำกว่าเกณฑ์ CLO ${nClo}${nOver ? ` · ขาดส่ง ${nOver}` : ""}`
                      : "ไม่มีใครต่ำกว่าเกณฑ์") + (nInc ? ` · รอคะแนน ${nInc}` : "")
              }
              tone={enrolledCount === 0 ? "nil" : nFail ? "bad" : nClo + nOver ? "warn" : "ok"}
            />
          </div>

          <CloAttainmentCard a={a} courseId={course.id} />

          {sum && !locked && !noScores && <OverviewCharts summary={sum} />}

          <FollowUpTable
            rows={rows}
            enrolledCount={enrolledCount}
            passCriteria={passCriteria}
            onOpen={setStudent}
          />
        </>
      )}

      <StudentDrawer courseId={course.id} studentId={student} onClose={() => setStudent(null)} />
      {settings && (
        <CourseForm
          course={course}
          term={{ semester: course.semester, year: course.year }}
          onClose={() => setSettings(false)}
        />
      )}
    </CoursePage>
  )
}
