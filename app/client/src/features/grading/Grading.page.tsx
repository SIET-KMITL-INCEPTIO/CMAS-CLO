/**
 * การตัดเกรด — viewGrading of index-q.html. Every number on this page comes
 * from the server (totals, T-scores, the grade the scores give): grading has
 * one calculation (FR-88). "ประมวลผลเกรด" freezes the grades (CR-11) — scores
 * edited afterwards do not move them until it is run again — and the page says
 * so wherever a frozen grade and today's scores disagree.
 */
import { useState } from "react"
import { toast } from "sonner"
import { Tip } from "../../components/page/PageHeader.tsx"
import { Chip } from "../../components/ui/Badges.tsx"
import { TONE } from "../../components/ui/tone.ts"
import { useCan } from "../../hooks/useCan.ts"
import { ConfirmDelete } from "../clos/ConfirmDelete.tsx"
import { n2 } from "../clos/useClos.ts"
import { CoursePage } from "../courses/CoursePage.tsx"
import { METHOD_TH, SCALE_TH } from "../courses/courseView.ts"
import { useCourseContext } from "../courses/useCourseContext.ts"
import { BandForm } from "./BandForm.tsx"
import { gradingApi } from "./grading.api.ts"
import type { Band, GradingStudent } from "./grading.types.ts"
import { GradingSettings } from "./GradingSettings.tsx"
import { rangeText, withBand } from "./ladder.ts"
import { OverrideGrade } from "./OverrideGrade.tsx"
import { useGrading, useRunGrading, useSaveBands, useUnfreeze } from "./useGrading.ts"

const FAIL = new Set(["F", "U"])

export default function Grading() {
  const { course } = useCourseContext()
  const can = useCan(course)
  const q = useGrading(course.id)
  const g = q.data
  const run = useRunGrading(course.id)
  const unfreeze = useUnfreeze(course.id)
  const saveBands = useSaveBands(course.id)
  const [settings, setSettings] = useState(false)
  const [band, setBand] = useState<Band | "new" | null>(null)
  const [override, setOverride] = useState<GradingStudent | null>(null)
  const [confirmUnfreeze, setConfirmUnfreeze] = useState(false)
  const [sort, setSort] = useState<"desc" | "asc">("desc")
  const failed = (err: Error) => toast.error(err.message)

  const norm = g?.gradeMethod === "NORM_REFERENCED"
  const pf = g?.gradeScale === "PASS_FAIL"
  const students = g?.students ?? []
  const enrolled = students.filter((s) => s.status === "ENROLLED")
  const withdrawn = students.filter((s) => s.status === "WITHDRAWN")
  const incomplete = enrolled.filter((s) => !s.complete).length
  const maxCount = Math.max(1, ...(g?.bands.map((b) => b.count) ?? [1]))
  // Frozen but the scores now give another grade (and nobody overrode it): the issued one is stale.
  const stale = (s: GradingStudent) =>
    g?.frozen &&
    s.issuedGrade !== null &&
    !s.overrideReason &&
    s.derivedGrade !== null &&
    s.derivedGrade !== s.issuedGrade
  const loose = enrolled.filter(
    (s) => g?.frozen && s.issuedGrade === null && s.derivedGrade !== null,
  ).length
  const nStale = enrolled.filter(stale).length

  const sorted = [...students].sort((a, b) => {
    const d = (b.totalPercent ?? -1) - (a.totalPercent ?? -1)
    return sort === "desc" ? d : -d
  })

  const runGrading = () =>
    run.mutate(undefined, {
      onSuccess: (r) =>
        toast.success(
          `ตรึงเกรดแล้ว ${r.issued} คน${r.skipped ? ` · ข้าม ${r.skipped} คนที่คะแนนไม่ครบ` : ""}`,
        ),
      onError: failed,
    })

  const freezeNote: [keyof typeof TONE, string] | null = !g
    ? null
    : !g.frozen
      ? enrolled.some((s) => s.derivedGrade !== null)
        ? ["info", "ยังไม่ได้ประมวลผลเกรด — เกรดในตารางยังเปลี่ยนตามคะแนน"]
        : null
      : nStale || loose
        ? [
            "warn",
            [
              nStale
                ? `มี ${nStale} คนที่คะแนนเปลี่ยนหลังตรึงเกรด — เกรดที่ออกยังเป็นค่าที่ตรึงไว้`
                : "",
              loose ? `มี ${loose} คนที่คะแนนครบแล้วแต่ยังไม่ถูกตรึง` : "",
            ]
              .filter(Boolean)
              .join(" · ") + " · กด “ประมวลผลเกรด” เพื่อคำนวณและตรึงใหม่",
          ]
        : [
            "ok",
            `ตรึงเกรดแล้ว ${students.filter((s) => s.issuedGrade).length} คน — ตรงกับคะแนนปัจจุบันทุกคน`,
          ]

  const tools = g && (
    <>
      {can("band.write") && (
        <button type="button" className="btn" onClick={() => setSettings(true)}>
          ตั้งค่าการตัดเกรด
        </button>
      )}
      {can("results.export") && (
        <button
          type="button"
          className="btn"
          onClick={() => gradingApi.export(course.id).catch(failed)}
        >
          ส่งออกผลการเรียน
        </button>
      )}
      {can("grading.run") && (
        <button
          type="button"
          className="btn btn-primary"
          disabled={run.isPending}
          onClick={runGrading}
        >
          ประมวลผลเกรด
        </button>
      )}
    </>
  )
  const help = (
    <>
      “ประมวลผลเกรด” ตรึงเกรดไว้ — แก้คะแนนภายหลังเกรดจะไม่เปลี่ยนจนกว่าจะประมวลผลใหม่ ·
      การปรับเกรดต้องมีเหตุผลเสมอและยกเลิกได้
    </>
  )

  let body
  if (q.isLoading) body = <div className="text-[14px] text-dim">กำลังโหลด…</div>
  else if (!g) body = null
  else
    body = (
      <>
        <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
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
                        <div className="tnum text-[22px] font-light">
                          {v === null ? "—" : n2(v)}
                        </div>
                        <div className="text-[12.5px] text-dim">{k}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="hair flex items-center justify-between px-4 py-3 text-[14px] text-ink2">
              <span>ขั้นบันไดเกรด</span>
              <span className="flex items-center gap-2">
                <span>อ่านเป็น {norm ? "T-score" : "ร้อยละ"}</span>
                {can("band.write") && !pf && (
                  <button type="button" className="btn btn-quiet" onClick={() => setBand("new")}>
                    + ระดับเกรด
                  </button>
                )}
              </span>
            </div>
            <div className="scroll-x">
              <table className="dt">
                <thead>
                  <tr>
                    <th>เกรด</th>
                    <th>ช่วง ({norm ? "T-score" : "ร้อยละ"})</th>
                    <th>การกระจาย</th>
                    <th className="num">จำนวน</th>
                    <th className="no-print" style={{ width: 130 }} />
                  </tr>
                </thead>
                <tbody>
                  {g.bands.map((b, i) => (
                    <tr key={b.grade}>
                      <td>
                        <span className="tnum text-[15px] font-medium">{b.grade}</span>
                        {b.isPassFloor && (
                          <span className="ml-1.5 text-[12.5px] text-ok">ผ่านขั้นต่ำ</span>
                        )}
                        {b.isFail && <span className="ml-1.5 text-[12.5px] text-bad">ไม่ผ่าน</span>}
                      </td>
                      <td className="tnum text-[14px]">{rangeText(b, i, norm)}</td>
                      <td style={{ width: 220 }}>
                        <div className="h-4 overflow-hidden rounded-sm bg-wash">
                          <div
                            className="h-full bg-haze"
                            style={{ width: `${(b.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="num tnum">{b.count}</td>
                      <td className="no-print">
                        {can("band.write") && (
                          <div className="flex justify-end gap-0.5">
                            <button
                              type="button"
                              className="btn btn-quiet"
                              onClick={() => setBand({ grade: b.grade, minValue: b.minValue })}
                            >
                              แก้ไข
                            </button>
                            {b.minValue !== 0 && !pf && (
                              <button
                                type="button"
                                className="btn btn-quiet btn-danger"
                                disabled={saveBands.isPending}
                                onClick={() =>
                                  saveBands.mutate(
                                    {
                                      bands: withBand(
                                        g.bands.map(({ grade, minValue }) => ({ grade, minValue })),
                                        b.grade,
                                        null,
                                      ),
                                    },
                                    {
                                      onSuccess: () => toast.success(`ลบระดับเกรด ${b.grade} แล้ว`),
                                      onError: failed,
                                    },
                                  )
                                }
                              >
                                ลบ
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {incomplete > 0 && (
          <div
            className="mb-4 flex items-start gap-3 rounded-lg px-5 py-4 text-[14px]"
            style={{ background: TONE.warn.bg, color: TONE.warn.tx }}
          >
            <span>⚠</span>
            <div>
              มี {incomplete} คนที่คะแนนยังไม่ครบ — ระบบไม่ออกเกรดให้ และจะไม่แทนด้วย{" "}
              {pf ? "U" : "F"}
            </div>
          </div>
        )}
        {g.meta.warnings.length > 0 && (
          <div
            className="mb-4 rounded-lg px-5 py-3 text-[13px]"
            style={{ background: TONE.nil.bg, color: "var(--ink2)" }}
          >
            {g.meta.warnings.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
        )}
        {freezeNote && (
          <div
            className="mb-4 flex flex-wrap items-center gap-3 rounded-lg px-5 py-3 text-[14px]"
            style={{ background: TONE[freezeNote[0]].bg, color: TONE[freezeNote[0]].tx }}
          >
            <span className="min-w-[240px] flex-1">{freezeNote[1]}</span>
            {g.frozen && can("grading.run") && (
              <button
                type="button"
                className="btn btn-quiet no-print"
                onClick={() => setConfirmUnfreeze(true)}
              >
                ยกเลิกการตรึงเกรด
              </button>
            )}
          </div>
        )}
        {withdrawn.length > 0 && (
          <div
            className="mb-4 rounded-lg px-5 py-3 text-[14px]"
            style={{ background: TONE.nil.bg, color: "var(--ink2)" }}
          >
            ถอนรายวิชา {withdrawn.length} คน — แสดง W ไม่อยู่ในการตัดเกรดและไม่นับในสถิติของกลุ่ม:{" "}
            {withdrawn.map((s) => `${s.studentCode} ${s.name}`).join(" · ")}
          </div>
        )}

        <div className="card scroll-x overflow-hidden">
          <div className="hair px-4 py-3 text-[14px] text-ink2">
            เกรดรายบุคคล{pf ? " · แสดง S/U เท่านั้น" : ""}
          </div>
          <table className="dt">
            <thead>
              <tr>
                <th>นักศึกษา</th>
                <th
                  className="num sortable"
                  onClick={() => setSort(sort === "desc" ? "asc" : "desc")}
                >
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
              {sorted.map((s) => {
                const shown = s.issuedGrade ?? s.derivedGrade
                return (
                  <tr
                    key={s.studentId}
                    className={s.status === "WITHDRAWN" ? "text-dim" : undefined}
                  >
                    <td className="who">
                      <span className="code">{s.studentCode}</span>
                      <span className="nm block">{s.name}</span>
                    </td>
                    <td className="num tnum">
                      {s.totalPercent === null ? "—" : n2(s.totalPercent)}
                    </td>
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
                          <span className="ml-1.5 text-[12.5px] font-normal text-dim">
                            ยังไม่ตรึง
                          </span>
                        )}
                      {stale(s) && (
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
                      {can("grade.override") &&
                      g.frozen &&
                      s.issuedGrade &&
                      s.status === "ENROLLED" ? (
                        <button
                          type="button"
                          className="btn btn-quiet"
                          onClick={() => setOverride(s)}
                        >
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
      </>
    )

  return (
    <CoursePage title="การตัดเกรด" tools={tools} help={help}>
      {body}
      {g && settings && (
        <GradingSettings courseId={course.id} grading={g} onClose={() => setSettings(false)} />
      )}
      {g && band && (
        <BandForm
          courseId={course.id}
          grading={g}
          band={band === "new" ? null : band}
          onClose={() => setBand(null)}
        />
      )}
      {g && override && (
        <OverrideGrade grading={g} student={override} onClose={() => setOverride(null)} />
      )}
      {confirmUnfreeze && (
        <ConfirmDelete
          title="ยกเลิกการตรึงเกรด"
          label="ยกเลิกการตรึง"
          warning="เกรดที่ตรึงไว้จะถูกล้าง — เกรดจะเปลี่ยนตามคะแนนอีกครั้งจนกว่าจะประมวลผลใหม่"
          rows={[
            ["เกรดที่ตรึงไว้", students.filter((s) => s.issuedGrade).length],
            ["เกรดที่ปรับเอง (ไปด้วย)", students.filter((s) => s.overrideReason).length],
          ]}
          note="เกรดที่ออกจะกลับไปเปลี่ยนตามคะแนนอีกครั้ง · การปรับเกรดทั้งหมดและเหตุผลจะหายด้วย"
          pending={unfreeze.isPending}
          onClose={() => setConfirmUnfreeze(false)}
          onConfirm={() =>
            unfreeze.mutate(undefined, {
              onSuccess: () => {
                toast.success("ยกเลิกการตรึงเกรดแล้ว")
                setConfirmUnfreeze(false)
              },
              onError: failed,
            })
          }
        />
      )}
    </CoursePage>
  )
}
