import { Tip } from "../../components/page/PageHeader.tsx"
import { n2 } from "../clos/useClos.ts"
import { METHOD_TH, SCALE_TH } from "../courses/courseView.ts"
import type { Grading } from "./grading.types.ts"

/** "วิธีตัดเกรด": the method, the scale, the pass mark and — for norm-referenced — the group's n / mean / SD. */
export function GradingMethodCard({ g }: { g: Grading }) {
  const norm = g.gradeMethod === "NORM_REFERENCED"
  const pf = g.gradeScale === "PASS_FAIL"
  return (
    <div className="card overflow-hidden">
      <div className="hair px-4 py-3 text-[14px] text-ink2">วิธีตัดเกรด</div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-[19px]">
          {METHOD_TH[g.gradeMethod]}
          <Tip
            text={
              pf
                ? "รายวิชานี้รายงานผลเป็น ผ่าน (S) / ไม่ผ่าน (U) เท่านั้น — ไม่แสดงเกรด A–F"
                : norm
                  ? "ขอบเขตของเกรดอ่านเป็น T-score เพราะตัดเกรดแบบอิงกลุ่ม"
                  : "ขอบเขตของเกรดอ่านเป็นร้อยละ เพราะตัดเกรดแบบอิงเกณฑ์"
            }
          />
        </div>
        <div className="hair-t mt-5 grid grid-cols-2 gap-4 pt-4">
          <div>
            <div className="over">รูปแบบเกรด</div>
            <div className="mt-1 text-[14px]">{SCALE_TH[g.gradeScale]}</div>
          </div>
          <div>
            <div className="over">เกณฑ์ผ่านรายวิชา</div>
            <div className="tnum mt-1 text-[14px]">{n2(g.passCriteria)}%</div>
            {g.passCriteriaSource === "LADDER" && (
              <div className="mt-0.5 text-[12.5px] text-dim">ตามขั้นบันไดเกรด</div>
            )}
          </div>
        </div>
        {norm && (
          <div className="hair-t mt-4 pt-4">
            <div className="over mb-2 flex items-center gap-1.5">
              สถิติของกลุ่ม
              <Tip text="mean / SD / T ไม่ถูกเก็บลงฐานข้อมูล — คำนวณตอนกดตัดเกรด แล้วเขียนเฉพาะ totalPercent กับ grade" />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {(
                [
                  ["n", g.stats.n],
                  ["mean", g.stats.mean],
                  ["SD", g.stats.sd],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <div className="tnum text-[22px] font-light">{v === null ? "—" : n2(v)}</div>
                  <div className="text-[12.5px] text-dim">{k}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
