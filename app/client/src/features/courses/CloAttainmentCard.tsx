import { Link } from "react-router-dom"
import {
  Bar,
  BarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartHead, Hollow } from "../../components/page/Blocks.tsx"
import { Chip } from "../../components/ui/Badges.tsx"
import { TONE } from "../../components/ui/tone.ts"
import { n2 } from "../clos/useClos.ts"
import type { Attainment, CloAttainment } from "../dashboard/dashboard.types.ts"
import { attainmentState } from "./overviewView.ts"

/** CR-04: the CLO's verdict, said the same way on every page. */
function Verdict({ a }: { a: CloAttainment }) {
  if (a.attainment === null) return <Chip tone="nil">ยังไม่มีคะแนน</Chip>
  const open = a.notEvaluatedCount + a.provisionalCount
  return (
    <div>
      {a.atRiskCount ? (
        <Chip tone="warn">ยังไม่ผ่าน {a.atRiskCount} คน</Chip>
      ) : (
        <Chip tone="ok">ผ่านทุกคน</Chip>
      )}
      {a.atRiskCount * 2 > a.evaluableCount && (
        <div
          className="mt-1 text-[12.5px] whitespace-nowrap text-bad"
          title="คนส่วนใหญ่ไม่ผ่านข้อเดียวกัน — เป็นสัญญาณของการสอนหรือการวัดผล มากกว่าของนักศึกษารายคน"
        >
          เกินครึ่งชั้น
        </div>
      )}
      {open > 0 && (
        <div className="mt-1 text-[12.5px] whitespace-nowrap text-warn">ยังรอคะแนน {open} คน</div>
      )}
    </div>
  )
}

function ShareBar({ a }: { a: CloAttainment }) {
  const n = a.evaluableCount + a.notEvaluatedCount || 1
  const label = `ผ่าน ${a.passedCount} · ต่ำกว่าเกณฑ์ ${a.atRiskCount} · ยังไม่มีคะแนน ${a.notEvaluatedCount} คน`
  const seg = (v: number, bg: string) =>
    v ? <i style={{ width: `${(v / n) * 100}%`, background: bg }} /> : null
  return (
    <div className="sharebar mt-1.5" role="img" aria-label={label} title={label}>
      {seg(a.passedCount, TONE.ok.bar)}
      {seg(a.atRiskCount, TONE.bad.bar)}
      {seg(a.notEvaluatedCount, TONE.nil.bar)}
    </div>
  )
}

/** "ผู้ผ่านราย CLO": the radar (or bars under three CLOs) and the per-CLO table with each verdict. */
export function CloAttainmentCard({
  a,
  courseId,
}: {
  a: Attainment | undefined
  courseId: string
}) {
  const { locked, noScores } = attainmentState(a)
  const people = a?.helpCount ?? 0
  const radar = (a?.clos ?? []).map((c) => ({
    clo: `CLO ${c.number}`,
    pass: c.attainment ?? 0,
  }))
  return (
    <div className="card mb-4 overflow-hidden">
      <ChartHead
        title="ผู้ผ่านราย CLO"
        sub={
          !a?.clos.length
            ? "ยังไม่มี CLO"
            : locked
              ? "ยังคำนวณไม่ได้ — ตั้งค่าให้ครบก่อน"
              : `เกณฑ์ผ่าน CLO ${n2(a.cloPassMark)}%`
        }
        help={
          "ขอบนอกสุดของเรดาร์ = ผ่านทุกคน\nนักศึกษาถูกตัดสินทันทีที่มีคะแนนของ CLO ข้อนั้น — “ยังรอคะแนน” คือคะแนนของบางคนยังไม่ครบ"
        }
        right={
          !locked &&
          !noScores &&
          (people ? (
            <Chip tone="warn">{people} คน ยังไม่ผ่านอย่างน้อย 1 CLO</Chip>
          ) : (
            <Chip tone="ok">ทุกคนผ่านทุกข้อ</Chip>
          ))
        }
      />
      {!a?.clos.length ? (
        <Hollow>
          ยังไม่มี CLO ในรายวิชานี้ —{" "}
          <Link to={`/courses/${courseId}/clos`} className="text-ink underline underline-offset-2">
            เพิ่ม CLO
          </Link>
        </Hollow>
      ) : locked ? (
        <div className="px-6 py-10 text-center">
          <div className="text-[15px] text-ink">ยังไม่แสดงผลการบรรลุ CLO</div>
          <ul className="mx-auto mt-2 max-w-[52ch] space-y-1 text-[14px] leading-relaxed text-ink2">
            {a.meta.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="min-w-0 p-3" style={{ height: 280 }}>
            {radar.length >= 3 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radar} outerRadius="72%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="clo" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip formatter={(v) => `${n2(Number(v))}% ผ่าน`} />
                  <Radar dataKey="pass" stroke={TONE.ok.tx} fill={TONE.ok.bar} fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={radar}>
                  <XAxis dataKey="clo" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `${n2(Number(v))}% ผ่าน`} />
                  <Bar dataKey="pass" fill={TONE.ok.bar} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="scroll-x min-w-0">
            <table className="dt">
              <thead>
                <tr>
                  <th style={{ width: 74 }}>CLO</th>
                  <th>คำอธิบาย</th>
                  <th style={{ width: 150 }}>ผู้ผ่าน</th>
                  <th style={{ width: 132 }}>ยังไม่ผ่าน</th>
                </tr>
              </thead>
              <tbody>
                {a.clos.map((c) => (
                  <tr key={c.cloId}>
                    <td className="whitespace-nowrap">
                      <span className="tnum text-[14px] font-medium">CLO {c.number}</span>
                    </td>
                    <td>
                      <div className="line-clamp-2 text-[14px]">{c.description}</div>
                    </td>
                    <td>
                      <div className="tnum flex items-baseline justify-between gap-2 text-[14px]">
                        <span className="font-medium">
                          {c.attainment === null ? "—" : `${n2(c.attainment)}%`}
                        </span>
                        <span className="text-[12.5px] whitespace-nowrap text-dim">
                          {c.passedCount}/{c.evaluableCount} คน
                        </span>
                      </div>
                      <ShareBar a={c} />
                    </td>
                    <td>
                      <Verdict a={c} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
