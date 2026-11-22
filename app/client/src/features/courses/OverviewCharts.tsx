import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartHead, Hollow } from "../../components/page/Blocks.tsx"
import { TONE } from "../../components/ui/tone.ts"
import { n2 } from "../clos/useClos.ts"
import type { CourseSummary } from "../dashboard/dashboard.types.ts"

/** Pass / fail / no score per activity, and the spread of the class's totals against the pass mark. */
export function OverviewCharts({ summary }: { summary: CourseSummary }) {
  const { passCriteria, totals } = summary.course
  const acts = summary.activities.map((x) => ({
    name: x.name,
    pass: x.passCount,
    fail: x.failCount,
    none: x.missingCount,
    avg: x.averagePercent,
  }))
  // FR-88: the bins come from the server (lib/attainment.ts distribution), not counted here.
  const bins = summary.course.distribution.map((b) => ({
    // Each bin holds [from, to); the last one also holds 100.
    range: b.to === 100 ? `${b.from}–100` : `${b.from}–<${b.to}`,
    from: b.from,
    n: b.count,
  }))
  return (
    <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="card overflow-hidden">
        <ChartHead
          title="ผ่าน / ไม่ผ่านในแต่ละกิจกรรม"
          sub="นับเป็นจำนวนคน · คะแนนเฉลี่ยของกิจกรรมอยู่ใน tooltip"
          help="เกณฑ์ผ่านของกิจกรรมใช้ดูภาพรวมเท่านั้น ไม่มีผลต่อการตัดสิน CLO"
        />
        <div className="p-3" style={{ height: Math.max(180, acts.length * 38 + 40) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={acts} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v, key) => [
                  `${String(v)} คน`,
                  key === "pass" ? "ผ่าน" : key === "fail" ? "ไม่ผ่าน" : "ยังไม่มีคะแนน",
                ]}
                labelFormatter={(label, items) => {
                  const avg = (items?.[0]?.payload as { avg: number | null } | undefined)?.avg
                  return `${String(label)}${avg === null || avg === undefined ? "" : ` · เฉลี่ย ${n2(avg)}%`}`
                }}
              />
              <Bar dataKey="pass" stackId="a" fill={TONE.ok.bar} />
              <Bar dataKey="fail" stackId="a" fill={TONE.bad.bar} />
              <Bar dataKey="none" stackId="a" fill={TONE.nil.bar} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card overflow-hidden">
        <ChartHead
          title="การกระจายคะแนนรวม (คน)"
          sub={`เส้นประ = เกณฑ์ผ่านรายวิชา ${n2(passCriteria)}%`}
          help="นับเฉพาะคนที่คะแนนครบ — คะแนนที่ขาดไม่ใช่ 0"
        />
        <div className="p-3" style={{ height: 260 }}>
          {totals.length === 0 ? (
            <Hollow>ยังไม่มีคนที่คะแนนครบ</Hollow>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bins}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="from" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v) => [`${String(v)} คน`, "จำนวน"]}
                  labelFormatter={(_, items) =>
                    `${String((items?.[0]?.payload as { range: string } | undefined)?.range ?? "")}%`
                  }
                />
                <ReferenceLine
                  x={Math.min(90, Math.floor(passCriteria / 10) * 10)}
                  stroke={TONE.bad.tx}
                  strokeDasharray="4 3"
                />
                <Bar dataKey="n" fill={TONE.info.bar} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
