/**
 * ภาพรวมรายวิชา — viewOverview of index-q.html: the course's one summary page.
 * Who passed the course, who passed each CLO, how each activity went, how the
 * totals spread, and who needs following up. All of it from one call,
 * /dashboard/summary, which computes every verdict and count from one snapshot
 * on the server. A score not yet entered is never a 0 (FR-84).
 */
import { useState } from "react"
import { Link } from "react-router-dom"
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Band, ChartHead, Hollow, Stat } from "../../components/page/Blocks.tsx"
import { Chip } from "../../components/ui/Badges.tsx"
import { TONE, type Tone } from "../../components/ui/tone.ts"
import { useCan } from "../../hooks/useCan.ts"
import { n2 } from "../clos/useClos.ts"
import type { AtRiskRow, CloAttainment } from "../dashboard/dashboard.types.ts"
import { StudentDrawer } from "../dashboard/StudentDrawer.tsx"
import { useCourseSummary } from "../dashboard/useDashboard.ts"
import { CourseForm } from "./CourseForm.tsx"
import { CoursePage } from "./CoursePage.tsx"
import { useCourseContext } from "./useCourseContext.ts"

const LEVEL: Record<AtRiskRow["level"], [string, Tone]> = {
  COURSE_FAIL: ["ไม่ผ่านรายวิชา", "bad"],
  CLO_BELOW: ["ต่ำกว่าเกณฑ์ CLO", "warn"],
  OVERDUE: ["ขาดส่งงาน", "warn"],
}

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

/** Why this student is on the follow-up list (followWhy of the prototype). */
function why(r: AtRiskRow, passCriteria: number) {
  const parts: string[] = []
  if (r.failedClos.length)
    parts.push(
      "ต่ำกว่าเกณฑ์ " +
        r.failedClos
          .map((c) => `CLO ${c.number}${c.provisional ? "*" : ""} (−${n2(c.gap ?? 0)})`)
          .join(", "),
    )
  else if (r.level === "COURSE_FAIL") parts.push(`คะแนนรวมต่ำกว่าเกณฑ์ผ่าน ${n2(passCriteria)}%`)
  if (r.overdue.length) parts.push(`ขาดส่ง ${r.overdue.map((o) => o.name).join(", ")}`)
  return parts.join(" · ")
}

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
  const locked = a ? !a.meta.computable : false
  const noScores = a ? a.clos.every((c) => c.attainment === null) : true
  const people = a?.helpCount ?? 0

  const radar = (a?.clos ?? []).map((c) => ({
    clo: `CLO ${c.number}`,
    pass: c.attainment ?? 0,
  }))

  const acts = (sum?.activities ?? []).map((x) => ({
    name: x.name,
    pass: x.passCount,
    fail: x.failCount,
    none: x.missingCount,
    avg: x.averagePercent,
  }))

  const bins = Array.from({ length: 10 }, (_, i) => ({
    range: i === 9 ? "90–100" : `${i * 10}–${i * 10 + 9}`,
    from: i * 10,
    n: totals.filter((t) => (i === 9 ? t >= 90 : t >= i * 10 && t < i * 10 + 10)).length,
  }))

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
      {loading ? (
        <div className="text-[14px] text-dim">กำลังโหลด…</div>
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
                <Link
                  to={`/courses/${course.id}/clos`}
                  className="text-ink underline underline-offset-2"
                >
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
                        <Radar
                          dataKey="pass"
                          stroke={TONE.ok.tx}
                          fill={TONE.ok.bar}
                          fillOpacity={0.35}
                        />
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

          {!locked && !noScores && (
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
                          const avg = (items?.[0]?.payload as { avg: number | null } | undefined)
                            ?.avg
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
          )}

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
                              onClick={() => setStudent(r.studentId)}
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
