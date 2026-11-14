/**
 * ดูรายบุคคล — the prototype's `data-act="student"` drawer: one student's CLO
 * scores beside the pass mark, the activities behind them (raw score and
 * percent, M5), the total and the grade. All of it from the server (FR-85/86).
 */
import { Drawer } from "../../components/overlay/Sheet.tsx"
import { Chip } from "../../components/ui/Badges.tsx"
import { n2 } from "../clos/useClos.ts"
import type { StudentResult } from "./dashboard.types.ts"
import { useStudentResult } from "./useDashboard.ts"

const CLO_TONE = { PASS: "ok", AT_RISK: "bad", NOT_EVALUATED: "nil" } as const
const CLO_TH = { PASS: "ผ่าน", AT_RISK: "ยังไม่ผ่าน", NOT_EVALUATED: "ยังไม่มีคะแนน" } as const
const ACT_TH = {
  SCORED: null,
  EXCUSED: "ยกเว้น",
  OVERDUE: "ขาดส่ง",
  MISSING: "ยังไม่มีคะแนน",
} as const

function Result({ r }: { r: StudentResult }) {
  const verdict =
    r.coursePassed === null ? (
      <Chip tone="nil">ยังประเมินไม่ครบ</Chip>
    ) : r.coursePassed ? (
      <Chip tone="ok">ผ่านรายวิชา</Chip>
    ) : (
      <Chip tone="bad">ไม่ผ่านรายวิชา</Chip>
    )
  const mark = r.gradeScale === "PASS_FAIL" ? r.passFailResult : r.grade
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {verdict}
        <span className="tnum text-[14px] text-ink2">
          คะแนนรวม {r.totalScore === null ? "—" : `${n2(r.totalScore)}%`}
        </span>
        {mark && <Chip tone="info">{r.gradeScale === "PASS_FAIL" ? mark : `เกรด ${mark}`}</Chip>}
        {r.student.status === "WITHDRAWN" && <Chip tone="nil">ถอนรายวิชา</Chip>}
      </div>

      <section>
        <div className="over mb-2">คะแนนราย CLO</div>
        <ul className="divide-y divide-edge">
          {r.clos.map((c) => {
            const plan = r.remediationPlans.find((p) => p.cloId === c.cloId)
            return (
              <li key={c.cloId} className="py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[14px] font-medium">CLO {c.number}</span>
                  <span className="flex items-center gap-2">
                    <span className="tnum text-[14px]">
                      {c.score === null ? "—" : `${n2(c.score)}%`}
                      {c.provisional && (
                        <span className="text-warn" title="คะแนนยังไม่ครบ">
                          {" "}
                          *
                        </span>
                      )}
                    </span>
                    <Chip tone={CLO_TONE[c.status]}>{CLO_TH[c.status]}</Chip>
                  </span>
                </div>
                <div className="mt-0.5 line-clamp-2 text-[13px] text-dim">{c.description}</div>
                {plan && (
                  <div className="mt-1.5 text-[13px] text-ink2">แผนพัฒนาผู้เรียน: {plan.plan}</div>
                )}
              </li>
            )
          })}
        </ul>
        <div className="mt-1 text-[12.5px] text-dim">
          เกณฑ์ผ่าน CLO {r.clos[0] ? `${n2(r.clos[0].passMark)}%` : "—"} ·{" "}
          <span className="text-warn">*</span> = คะแนนยังไม่ครบ
        </div>
      </section>

      <section>
        <div className="over mb-2">คะแนนรายกิจกรรม</div>
        <table className="dt">
          <thead>
            <tr>
              <th>กิจกรรม</th>
              <th className="num">คะแนน</th>
              <th className="num">%</th>
            </tr>
          </thead>
          <tbody>
            {r.activities.map((a) => (
              <tr key={a.activityId}>
                <td className="text-[14px]">
                  {a.name}
                  <div className="tnum text-[12.5px] text-dim">สัดส่วน {n2(a.weight)}%</div>
                </td>
                <td className="num tnum text-[14px]">
                  {a.score === null ? (
                    <span className={a.status === "OVERDUE" ? "text-bad" : "text-dim"}>
                      {ACT_TH[a.status] ?? "—"}
                    </span>
                  ) : (
                    <>
                      {n2(a.score)}
                      <span className="text-dim"> / {n2(a.maxScore)}</span>
                    </>
                  )}
                </td>
                <td className="num tnum text-[14px]">{a.percent === null ? "—" : n2(a.percent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

export function StudentDrawer({
  courseId,
  studentId,
  onClose,
}: {
  courseId: string
  studentId: string | null
  onClose: () => void
}) {
  const q = useStudentResult(courseId, studentId)
  return (
    <Drawer
      open={studentId !== null}
      onClose={onClose}
      title={q.data?.student.name ?? "ผลรายบุคคล"}
      sub={q.data?.student.studentCode}
    >
      {q.isLoading ? (
        <div className="text-[14px] text-dim">กำลังโหลด…</div>
      ) : q.isError ? (
        <div className="text-[14px] text-bad">{q.error.message}</div>
      ) : (
        q.data && <Result r={q.data} />
      )}
    </Drawer>
  )
}
