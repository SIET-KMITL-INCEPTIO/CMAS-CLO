import { Band, Hollow } from "../../components/page/Blocks.tsx"
import { Chip } from "../../components/ui/Badges.tsx"
import { TONE } from "../../components/ui/tone.ts"
import { n2 } from "../clos/useClos.ts"
import type { AtRiskRow } from "../dashboard/dashboard.types.ts"
import { LEVEL, why } from "./overviewView.ts"

/** "นักศึกษาที่ต้องติดตาม": most severe first, with the reason and a way into the student's own page. */
export function FollowUpTable({
  rows,
  enrolledCount,
  passCriteria,
  onOpen,
}: {
  rows: AtRiskRow[]
  enrolledCount: number
  passCriteria: number
  onOpen: (studentId: string) => void
}) {
  return (
    <div className="card mb-4 overflow-hidden">
      <Band
        label="นักศึกษาที่ต้องติดตาม"
        meta={
          enrolledCount > 0 && (
            <span title="เรียงตามความรุนแรง: ไม่ผ่านรายวิชา → ต่ำกว่าเกณฑ์ CLO หรือขาดส่ง · ตัวเลขในวงเล็บคือระยะห่างจากเกณฑ์ผ่าน CLO · * = คะแนนของข้อนั้นยังไม่ครบ">
              เรียงตามความรุนแรง
            </span>
          )
        }
      />
      {enrolledCount === 0 ? (
        <Hollow>ยังไม่มีรายชื่อนักศึกษา</Hollow>
      ) : rows.length === 0 ? (
        <Hollow ok>ไม่มีนักศึกษาที่ต่ำกว่าเกณฑ์ใด และไม่มีใครขาดส่ง</Hollow>
      ) : (
        <div className="scroll-x">
          <table className="dt">
            <thead>
              <tr>
                <th>นักศึกษา</th>
                <th style={{ width: 150 }}>ระดับ</th>
                <th className="mob-hide">เหตุผล</th>
                <th className="num" style={{ width: 96 }}>
                  รวม (%)
                </th>
                <th className="no-print" style={{ width: 110 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const [label, tone] = LEVEL[r.level]
                return (
                  <tr
                    key={r.studentId}
                    style={
                      r.level === "COURSE_FAIL"
                        ? { boxShadow: `inset 3px 0 0 ${TONE.bad.bar}` }
                        : undefined
                    }
                  >
                    <td>
                      <div className="text-[14px]">{r.name}</div>
                      <div className="tnum text-[13px] text-dim">{r.studentCode}</div>
                    </td>
                    <td>
                      <Chip tone={tone}>{label}</Chip>
                    </td>
                    <td className="mob-hide text-[14px] text-ink2">{why(r, passCriteria)}</td>
                    <td className="num tnum text-[14px]">
                      {r.totalScore === null ? "—" : n2(r.totalScore)}
                    </td>
                    <td className="no-print text-right">
                      <button
                        type="button"
                        className="btn btn-quiet"
                        onClick={() => onOpen(r.studentId)}
                      >
                        ดูรายบุคคล
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
