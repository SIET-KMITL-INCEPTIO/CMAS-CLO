/**
 * ผลรายนักศึกษา — viewDashboard of index-q.html. One row per student: the
 * CLO scores the server computed, coloured against the CLO pass mark (orange
 * = within NEAR_GAP, red = further), the CLOs passed and the total. A row
 * opens that student's detail. The class summary lives on the overview.
 */
import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { ChartHead, Hollow } from "../../components/page/Blocks.tsx"
import { SubTabs } from "../../components/page/PageHeader.tsx"
import { Chip } from "../../components/ui/Badges.tsx"
import { TONE } from "../../components/ui/tone.ts"
import { useCan } from "../../hooks/useCan.ts"
import { n2 } from "../clos/useClos.ts"
import { CoursePage } from "../courses/CoursePage.tsx"
import { useCourseContext } from "../courses/useCourseContext.ts"
import { useScoreGrid } from "../scores/useScores.ts"
import { dashboardApi } from "./dashboard.api.ts"
import type { ClassResultRow } from "./dashboard.types.ts"
import { StudentDrawer } from "./StudentDrawer.tsx"
import { useAttainment, useClassResults } from "./useDashboard.ts"

// SUBTABS.dashboard of index-q.html
const TABS = [
  { id: "percent", label: "ร้อยละราย CLO" },
  { id: "raw", label: "คะแนนดิบ" },
] as const
type Tab = (typeof TABS)[number]["id"]

/** Same as lib/attainment.ts NEAR_GAP: below the pass mark by this much or less = "ใกล้ผ่าน". */
const NEAR_GAP = 10

const cellStyle = (v: number, pm: number) =>
  v >= pm
    ? undefined
    : v >= pm - NEAR_GAP
      ? { background: "rgba(199,168,96,.18)", color: TONE.warn.tx }
      : { background: "rgba(185,111,110,.16)", color: TONE.bad.tx, fontWeight: 500 }

export default function Results() {
  const { course } = useCourseContext()
  const can = useCan(course)
  const [params, setParams] = useSearchParams()
  const view: Tab = params.get("view") === "raw" ? "raw" : "percent"
  const [filter, setFilter] = useState("")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [student, setStudent] = useState<string | null>(null)

  const att = useAttainment(course.id)
  // The whole class in one request; the raw tab reads the score grid instead.
  const results = useClassResults(course.id, view === "percent")
  const grid = useScoreGrid(course.id, 1)

  const pm = att.data?.cloPassMark ?? 0
  const clos = att.data?.clos ?? []
  const q = filter.trim().toLowerCase()
  const match = (code: string, name: string) => !q || `${code} ${name}`.toLowerCase().includes(q)

  const tools = (
    <>
      <input
        className="inp !w-56"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="ค้นหานักศึกษา"
        aria-label="ค้นหานักศึกษา"
      />
      {can("results.export") && (
        <button
          type="button"
          className="btn"
          onClick={() => dashboardApi.export(course.id).catch((e: Error) => toast.error(e.message))}
        >
          ส่งออกผลการเรียน
        </button>
      )}
    </>
  )

  const help = (
    <>
      คะแนน CLO ของนักศึกษาแต่ละคน · กดแถวเพื่อดูรายบุคคล · ผลสรุปของทั้งชั้นอยู่ที่หน้าภาพรวม
      <div className="mt-3 space-y-1.5 text-[13px]">
        <div className="over !mb-1">สีของช่อง (เกณฑ์ผ่าน CLO {n2(pm)}%)</div>
        <div>
          <b className="font-medium" style={{ color: TONE.warn.tx }}>
            ส้ม
          </b>{" "}
          — ต่ำกว่าเกณฑ์ แต่ห่างไม่เกิน {NEAR_GAP} คะแนน (ใกล้ผ่าน)
        </div>
        <div>
          <b className="font-medium" style={{ color: TONE.bad.tx }}>
            แดง
          </b>{" "}
          — ต่ำกว่าเกณฑ์เกิน {NEAR_GAP} คะแนน (ห่างมาก)
        </div>
        <div>
          <span className="text-warn">*</span> คะแนนยังไม่ครบ · — ยังไม่มีคะแนน
        </div>
      </div>
    </>
  )

  const body = () => {
    if (att.isLoading) return <div className="text-[14px] text-dim">กำลังโหลด…</div>
    if (att.data && !att.data.meta.computable)
      return (
        <div className="card overflow-hidden">
          <ChartHead title="ยังคำนวณไม่ได้" sub="แก้ข้อต่อไปนี้ให้ครบก่อน ระบบจึงจะคำนวณผลให้" />
          <ul className="space-y-2.5 px-4 py-5">
            {att.data.meta.blockers.map((b) => (
              <li
                key={b}
                className="flex items-center gap-4 rounded-lg px-5 py-3.5 text-[14px]"
                style={{ background: TONE.bad.bg, color: TONE.bad.tx }}
              >
                <span>✕</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )
    if (clos.every((c) => c.attainment === null))
      return (
        <div className="card px-8 py-10 text-center">
          <div className="text-[17px] text-ink">ยังไม่มีคะแนนในรายวิชานี้</div>
          <div className="mx-auto mt-2 max-w-[46ch] text-[14px] text-dim">
            กรอกหรือนำเข้าคะแนนอย่างน้อยหนึ่งกิจกรรมก่อน
          </div>
          <Link to={`/courses/${course.id}/roster`} className="btn btn-primary mt-5 inline-flex">
            ไปหน้ากรอกคะแนน
          </Link>
        </div>
      )
    return view === "percent" ? percentTab() : rawTab()
  }

  const percentTab = () => {
    const loaded = results.data ?? []
    const pending = results.isLoading
    const passed = (r: ClassResultRow) => r.clos.filter((c) => c.status === "PASS").length
    const scored = (r: ClassResultRow) => r.clos.filter((c) => c.score !== null).length
    const shown = loaded
      .filter((r) => match(r.studentCode, r.name))
      .sort((a, b) => (sortDir === "asc" ? passed(a) - passed(b) : passed(b) - passed(a)))
    const below = loaded.filter((r) => r.clos.some((c) => c.status === "AT_RISK")).length
    return (
      <div className="card overflow-hidden">
        <ChartHead
          title="คะแนน CLO รายคน (%)"
          sub={
            <>
              แดง/ส้ม = ต่ำกว่าเกณฑ์ผ่าน CLO {n2(pm)}% · <span className="text-warn">*</span> =
              คะแนนยังไม่ครบ
            </>
          }
          right={
            pending ? (
              <span className="text-[13px] text-dim">กำลังโหลด…</span>
            ) : (
              <Chip tone={below ? "bad" : "ok"}>ต่ำกว่าเกณฑ์ {below} คน</Chip>
            )
          }
        />
        {!pending && loaded.length === 0 ? (
          <Hollow>ยังไม่มีรายชื่อนักศึกษา</Hollow>
        ) : shown.length === 0 && !pending ? (
          <Hollow>ไม่พบนักศึกษาที่ตรงกับคำค้น</Hollow>
        ) : (
          <div className="scroll-x">
            <table className="dt">
              <thead>
                <tr>
                  <th className="who sticky left-0 z-10 bg-wash">นักศึกษา</th>
                  {clos.map((c) => (
                    <th key={c.cloId} className="num" title={c.description}>
                      CLO {c.number}
                    </th>
                  ))}
                  <th className="num">
                    <button
                      type="button"
                      className="hover:text-ink"
                      onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                      aria-label="เรียงตาม CLO ที่ผ่าน"
                    >
                      CLO ที่ผ่าน {sortDir === "asc" ? "▲" : "▼"}
                    </button>
                  </th>
                  <th className="num">คะแนนรวม (%)</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const atRisk = r.clos.some((c) => c.status === "AT_RISK")
                  return (
                    <tr
                      key={r.studentId}
                      className="rowlink"
                      tabIndex={0}
                      onClick={() => setStudent(r.studentId)}
                      onKeyDown={(e) => e.key === "Enter" && setStudent(r.studentId)}
                      style={atRisk ? { boxShadow: `inset 3px 0 0 ${TONE.bad.bar}` } : undefined}
                    >
                      <td className="who sticky left-0 z-10 bg-card">
                        <span className="code">{r.studentCode}</span>
                        <span className="nm block">{r.name}</span>
                      </td>
                      {clos.map((c) => {
                        const v = r.clos.find((x) => x.cloId === c.cloId)
                        if (!v || v.score === null)
                          return (
                            <td key={c.cloId} className="num text-dim">
                              —
                            </td>
                          )
                        return (
                          <td key={c.cloId} className="num tnum" style={cellStyle(v.score, pm)}>
                            {n2(v.score)}
                            {v.provisional && (
                              <span className="text-warn" title="คะแนนยังไม่ครบ">
                                {" "}
                                *
                              </span>
                            )}
                          </td>
                        )
                      })}
                      <td className="num tnum font-medium">
                        {passed(r)} / {scored(r)}
                      </td>
                      <td className="num tnum">{r.totalScore === null ? "—" : n2(r.totalScore)}</td>
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

  // M5 — the raw points behind the percentages. Per activity: the score API
  // has no per-CLO raw sum, and the client does not compute one (FR-88).
  const rawTab = () => {
    const acts = grid.data?.activities ?? []
    const students = (grid.data?.students ?? []).filter(
      (s) => s.status === "ENROLLED" && match(s.studentCode, s.name),
    )
    const totalMax = acts.reduce((t, a) => t + a.maxScore, 0)
    return (
      <div className="card overflow-hidden">
        <ChartHead
          title="คะแนนดิบรายกิจกรรม (คะแนน)"
          sub="คะแนนที่ได้ / คะแนนเต็ม · — = ยังไม่มีคะแนน"
          help="ใช้อธิบายที่มาเท่านั้น — การตัดสินผ่าน CLO ใช้ % เทียบเกณฑ์ที่แท็บร้อยละราย CLO"
          right={<Chip tone="info">คะแนนเต็มรวม {n2(totalMax)}</Chip>}
        />
        {grid.isLoading ? (
          <div className="px-4 py-6 text-[14px] text-dim">กำลังโหลด…</div>
        ) : students.length === 0 ? (
          <Hollow>ไม่พบนักศึกษาที่ตรงกับคำค้น</Hollow>
        ) : (
          <div className="scroll-x">
            <table className="dt">
              <thead>
                <tr>
                  <th className="who sticky left-0 z-10 bg-wash">นักศึกษา</th>
                  {acts.map((a) => (
                    <th key={a.id} className="num">
                      {a.name}
                      <div className="tnum font-normal tracking-normal normal-case text-faint">
                        เต็ม {n2(a.maxScore)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className="rowlink"
                    tabIndex={0}
                    onClick={() => setStudent(s.id)}
                    onKeyDown={(e) => e.key === "Enter" && setStudent(s.id)}
                  >
                    <td className="who sticky left-0 z-10 bg-card">
                      <span className="code">{s.studentCode}</span>
                      <span className="nm block">{s.name}</span>
                    </td>
                    {acts.map((a) => {
                      const v = s.scores[a.id]
                      return (
                        <td key={a.id} className="num tnum">
                          {v === null || v === undefined ? (
                            <span className="text-dim">—</span>
                          ) : v === "EXCUSED" ? (
                            <span className="text-dim">ยกเว้น</span>
                          ) : (
                            n2(v)
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <CoursePage title="ผลรายนักศึกษา" tools={tools} help={help}>
      <div className="-mx-[18px] -mt-4 mb-4">
        <SubTabs tabs={TABS} value={view} onChange={(v) => setParams({ view: v })} />
      </div>
      {body()}
      <StudentDrawer courseId={course.id} studentId={student} onClose={() => setStudent(null)} />
    </CoursePage>
  )
}
