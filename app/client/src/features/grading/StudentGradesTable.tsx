import { Chip } from "../../components/ui/Badges.tsx"
import { n2 } from "../clos/useClos.ts"
import type { Grading, GradingStudent } from "./grading.types.ts"
import { isStale } from "./gradingView.ts"

const FAIL = new Set(["F", "U"])

/** "เกรดรายบุคคล": every student's total, the grade the scores give and the grade actually issued. */
export function StudentGradesTable({
  g,
  rows,
  sort,
  canOverride,
  onSort,
  onOverride,
}: {
  g: Grading
  /** Already sorted by total. */
  rows: GradingStudent[]
  sort: "desc" | "asc"
  canOverride: boolean
  onSort: () => void
  onOverride: (student: GradingStudent) => void
}) {
  const norm = g.gradeMethod === "NORM_REFERENCED"
  const pf = g.gradeScale === "PASS_FAIL"
  return (
    <div className="card scroll-x overflow-hidden">
      <div className="hair px-4 py-3 text-[14px] text-ink2">
        เกรดรายบุคคล{pf ? " · แสดง S/U เท่านั้น" : ""}
      </div>
      <table className="dt">
        <thead>
          <tr>
            <th>นักศึกษา</th>
            <th className="num sortable" onClick={() => onSort()}>
              รวม (%) <span className="caret">{sort === "desc" ? "▼" : "▲"}</span>
            </th>
            {norm && <th className="num">T-score</th>}
            <th>ผ่านรายวิชา</th>
            <th>ตามคะแนน</th>
            <th>ที่ออกจริง</th>
            <th>เหตุผลการปรับ</th>
            <th className="no-print" style={{ width: 96 }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const shown = s.issuedGrade ?? s.derivedGrade
            return (
              <tr key={s.studentId} className={s.status === "WITHDRAWN" ? "text-dim" : undefined}>
                <td className="who">
                  <span className="code">{s.studentCode}</span>
                  <span className="nm block">{s.name}</span>
                </td>
                <td className="num tnum">{s.totalPercent === null ? "—" : n2(s.totalPercent)}</td>
                {norm && <td className="num tnum">{s.tScore === null ? "—" : n2(s.tScore)}</td>}
                <td>
                  {s.status === "WITHDRAWN" ? (
                    <Chip tone="nil">ถอนรายวิชา</Chip>
                  ) : !s.complete ? (
                    <Chip tone="warn">รอประเมิน</Chip>
                  ) : s.derivedGrade && FAIL.has(s.derivedGrade) ? (
                    <Chip tone="bad">ไม่ผ่าน</Chip>
                  ) : (
                    <Chip tone="ok">ผ่าน</Chip>
                  )}
                </td>
                <td className="tnum text-[14px]">
                  {s.derivedGrade ?? <span className="text-dim">—</span>}
                </td>
                <td className="tnum text-[15px] font-medium">
                  {shown ?? <span className="text-dim">—</span>}
                  {s.overrideReason && (
                    <span className="ml-1.5 text-[12.5px] font-normal text-warn">ปรับแล้ว</span>
                  )}
                  {s.issuedGrade === null &&
                    s.derivedGrade &&
                    s.status === "ENROLLED" &&
                    g.frozen && (
                      <span className="ml-1.5 text-[12.5px] font-normal text-dim">ยังไม่ตรึง</span>
                    )}
                  {isStale(g, s) && (
                    <div
                      className="text-[12.5px] font-normal whitespace-nowrap text-warn"
                      title="เกรดที่ออกยังเป็นค่าที่ตรึงไว้ — กด “ประมวลผลเกรด” เพื่อคำนวณและตรึงใหม่"
                    >
                      คะแนนเปลี่ยนหลังตรึง · ตอนนี้ได้ {s.derivedGrade}
                    </div>
                  )}
                </td>
                <td className="max-w-[260px] text-[13px] text-ink2">
                  {s.overrideReason ?? <span className="text-dim">—</span>}
                </td>
                <td className="no-print">
                  {canOverride && g.frozen && s.issuedGrade && s.status === "ENROLLED" ? (
                    <button type="button" className="btn btn-quiet" onClick={() => onOverride(s)}>
                      ปรับเกรด
                    </button>
                  ) : (
                    <span className="text-[13px] text-dim">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
