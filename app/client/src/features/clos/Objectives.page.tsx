/**
 * จุดประสงค์เชิงพฤติกรรม — viewObjectives of index-q.html: one section per CLO,
 * each objective with the activities that measure it, weights inside a CLO
 * summing to 100 (T6). `?clo=` comes from the CLO page and opens on that CLO.
 */
import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { Chip, Pill } from "../../components/ui/Badges.tsx"
import { InlineNumber } from "../../components/ui/InlineNumber.tsx"
import { useCan } from "../../hooks/useCan.ts"
import { useCriteria } from "../activities/useActivities.ts"
import { CoursePage } from "../courses/CoursePage.tsx"
import { useCourseContext } from "../courses/useCourseContext.ts"
import type { Objective } from "./clo.types.ts"
import { ConfirmDelete } from "./ConfirmDelete.tsx"
import { ObjectiveForm } from "./ObjectiveForm.tsx"
import {
  evenShares,
  n2,
  near100,
  useCloList,
  useDeleteObjective,
  useObjectivesOf,
  useSetObjectiveWeights,
} from "./useClos.ts"

const TITLE = "จุดประสงค์เชิงพฤติกรรม"

export default function Objectives() {
  const { course } = useCourseContext()
  const can = useCan(course)
  const write = can("clo.write")
  const [params] = useSearchParams()
  const focus = params.get("clo")
  const list = useCloList(course.id)
  const clos = list.data?.clos ?? []
  const perClo = useObjectivesOf(
    course.id,
    clos.map((c) => c.id),
  )
  const criteria = useCriteria(course.id)
  const [form, setForm] = useState<{ cloId: string; objective: Objective | null } | null>(null)
  const [deleting, setDeleting] = useState<Objective | null>(null)
  const even = useSetObjectiveWeights()
  const remove = useDeleteObjective()

  const objectivesOf = (cloId: string) => perClo[clos.findIndex((c) => c.id === cloId)]?.data ?? []
  const cells = criteria.data?.cells ?? []
  const activityName = new Map((criteria.data?.activities ?? []).map((a) => [a.id, a.name]))
  const failed = (err: Error) => toast.error(err.message)
  const shown = (p: Promise<unknown>) =>
    p.catch((err: Error) => {
      failed(err)
      throw err
    })

  // Arriving from a CLO card: bring that CLO's section into view once it is drawn.
  const ready = clos.length > 0
  useEffect(() => {
    if (focus && ready) document.getElementById(`obj-${focus}`)?.scrollIntoView({ block: "start" })
  }, [focus, ready])

  const addButton = write && clos.length > 0 && (
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => setForm({ cloId: focus ?? clos[0]!.id, objective: null })}
    >
      เพิ่มจุดประสงค์
    </button>
  )
  const help = (
    <>
      น้ำหนักของจุดประสงค์ใต้ CLO เดียวกันต้องรวมได้ 100% · คะแนน CLO =
      ผลรวมของคะแนนจุดประสงค์ตามน้ำหนัก
    </>
  )

  let body
  if (list.isLoading) body = <div className="text-[14px] text-dim">กำลังโหลด…</div>
  else if (clos.length === 0)
    body = (
      <div className="card px-6 py-10 text-center">
        <div className="text-[16px] text-ink">ยังไม่มี CLO ให้แตกเป็นจุดประสงค์</div>
        <div className="mt-1.5 text-[14px] text-dim">เพิ่ม CLO ก่อน แล้วกลับมาที่หน้านี้</div>
        <Link className="btn btn-primary mt-4 inline-block" to={`/courses/${course.id}/clos`}>
          ไปเพิ่ม CLO
        </Link>
      </div>
    )
  else
    body = (
      <div className="space-y-4">
        {clos.map((c, i) => {
          const q = perClo[i]
          const objs = q?.data ?? []
          const sum = objs.reduce((t, o) => t + (o.weight ?? 0), 0)
          return (
            <section
              key={c.id}
              id={`obj-${c.id}`}
              className={`card scroll-mt-4 overflow-hidden ${focus === c.id ? "ring-2 ring-[#878CB4]" : ""}`}
            >
              <div className="hair flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0 flex-1 basis-[280px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tnum text-[15px] font-medium">CLO {c.number}</span>
                    <span className="tnum text-[13px] text-dim">
                      น้ำหนักตามแผน {n2(c.weight ?? 0)}%
                    </span>
                  </div>
                  <div className="mt-1 text-[14px] text-ink2">{c.description}</div>
                </div>
                <div className="no-print flex flex-wrap items-center gap-2">
                  <span
                    className={`tnum text-[14px] ${objs.length ? (near100(sum) ? "text-ok" : "text-warn") : "text-dim"}`}
                  >
                    รวม {n2(sum)}%{objs.length && near100(sum) ? " ✓" : ""}
                  </span>
                  {write && objs.length > 1 && !near100(sum) && (
                    <button
                      type="button"
                      className="btn btn-quiet"
                      disabled={even.isPending}
                      onClick={() => {
                        const shares = evenShares(objs.length)
                        even.mutate(
                          objs.map((o, k) => ({ objectiveId: o.id, weight: shares[k]! })),
                          { onError: failed },
                        )
                      }}
                    >
                      แบ่งเท่ากัน
                    </button>
                  )}
                  {write && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setForm({ cloId: c.id, objective: null })}
                    >
                      + เพิ่มจุดประสงค์
                    </button>
                  )}
                </div>
              </div>
              <div className="scroll-x">
                <table className="dt">
                  <thead>
                    <tr>
                      <th style={{ width: 56 }}>ข้อ</th>
                      <th>จุดประสงค์ · กิจกรรมที่วัด</th>
                      <th className="num" style={{ width: 96 }}>
                        น้ำหนัก (%)
                      </th>
                      {write && <th className="no-print" style={{ width: 104 }} />}
                    </tr>
                  </thead>
                  <tbody>
                    {q?.isLoading ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-[14px] text-dim">
                          กำลังโหลด…
                        </td>
                      </tr>
                    ) : objs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-[14px] text-dim">
                          ยังไม่มีจุดประสงค์ภายใต้ CLO นี้
                          {write && (
                            <>
                              {" — "}
                              <button
                                type="button"
                                className="text-ink underline underline-offset-2"
                                onClick={() => setForm({ cloId: c.id, objective: null })}
                              >
                                เพิ่มข้อแรก
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ) : (
                      objs.map((o) => {
                        const links = cells.filter((x) => x.objectiveId === o.id)
                        return (
                          <tr key={o.id}>
                            <td className="tnum text-[13px] whitespace-nowrap text-dim">
                              {o.label}
                            </td>
                            <td className="wrapcell">
                              <div className="text-[14px]">{o.description}</div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <span className="text-[12.5px] text-faint">วัดด้วย</span>
                                {links.length ? (
                                  links.map((x) => (
                                    <Pill key={x.activityId}>
                                      {activityName.get(x.activityId) ?? "?"} · {n2(x.weight)}%
                                    </Pill>
                                  ))
                                ) : (
                                  <Chip tone="bad">ยังไม่มีกิจกรรมวัด</Chip>
                                )}
                                {/* T8 — go and link it straight from this row */}
                                <Link
                                  className="no-print text-[13px] text-dim underline underline-offset-2 hover:text-ink"
                                  to={`/courses/${course.id}/activities?view=matrix`}
                                >
                                  {links.length ? "แก้การเชื่อม" : "เชื่อมกิจกรรม"}
                                </Link>
                              </div>
                            </td>
                            <td className="num">
                              <InlineNumber
                                value={o.weight}
                                label={`น้ำหนักของจุดประสงค์ ${o.label} ใน CLO ${c.number} (%)`}
                                disabled={!write}
                                onSave={(weight) =>
                                  shown(even.mutateAsync([{ objectiveId: o.id, weight }]))
                                }
                              />
                            </td>
                            {write && (
                              <td className="no-print">
                                <div className="flex justify-end gap-0.5">
                                  <button
                                    type="button"
                                    className="btn btn-quiet"
                                    onClick={() => setForm({ cloId: c.id, objective: o })}
                                  >
                                    แก้ไข
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-quiet btn-danger"
                                    onClick={() => setDeleting(o)}
                                  >
                                    ลบ
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )
        })}
      </div>
    )

  return (
    <CoursePage title={TITLE} tools={addButton} help={help}>
      {body}
      {form && (
        <ObjectiveForm
          objective={form.objective}
          cloId={form.cloId}
          clos={clos}
          objectivesOf={objectivesOf}
          onClose={() => setForm(null)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          title={`ลบจุดประสงค์ — ${deleting.label}`}
          label="ลบจุดประสงค์"
          rows={[
            ["การเชื่อมกับกิจกรรม", cells.filter((x) => x.objectiveId === deleting.id).length],
          ]}
          note="กิจกรรมที่เคยวัดจุดประสงค์นี้จะเหลือสัดส่วนไม่ครบ 100% จนกว่าจะเชื่อมใหม่"
          pending={remove.isPending}
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            remove.mutate(deleting.id, {
              onSuccess: () => {
                toast.success(`ลบจุดประสงค์ ${deleting.label} แล้ว`)
                setDeleting(null)
              },
              onError: failed,
            })
          }
        />
      )}
    </CoursePage>
  )
}
