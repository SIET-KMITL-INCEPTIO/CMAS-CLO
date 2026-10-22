/**
 * กิจกรรมและวิธีประเมิน — viewActivities of index-q.html. Two tabs on one
 * page because they are edited alternately until the weights reach 100%
 * (UX-01): the list (`?view=list`) and the matrix that checks the links
 * (`?view=matrix`). The list groups by type; in GROUP mode a group's weight is
 * typed at its head and shared out by full score (N1).
 */
import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { SubTabs, Tip } from "../../components/page/PageHeader.tsx"
import { Chip, Pill } from "../../components/ui/Badges.tsx"
import { InlineNumber } from "../../components/ui/InlineNumber.tsx"
import { useCan } from "../../hooks/useCan.ts"
import { ConfirmDelete } from "../clos/ConfirmDelete.tsx"
import { n2, near100, useCloList, useObjectivesOf, useSetCloWeights } from "../clos/useClos.ts"
import { CoursePage } from "../courses/CoursePage.tsx"
import { useCourseContext } from "../courses/useCourseContext.ts"
import type { Activity } from "./activity.types.ts"
import { ActivityForm } from "./ActivityForm.tsx"
import { groupKey, methodText, typeGroups, typeText } from "./activityView.ts"
import { CriteriaMatrix } from "./CriteriaMatrix.tsx"
import {
  useActivityList,
  useCriteria,
  useDeleteActivity,
  useDuplicateActivity,
  useReorderActivities,
  useSetWeightMode,
} from "./useActivities.ts"

type View = "list" | "matrix"
const TABS = [
  { id: "list", label: "กิจกรรมและวิธีประเมิน" },
  { id: "matrix", label: "ตรวจการเชื่อมกับ CLO" },
] as const

export default function Activities() {
  const { course } = useCourseContext()
  const can = useCan(course)
  const write = can("activity.write")
  const [params, setParams] = useSearchParams()
  const view: View = params.get("view") === "matrix" ? "matrix" : "list"

  const list = useActivityList(course.id)
  const criteria = useCriteria(course.id)
  const clos = useCloList(course.id)
  const objectives = useObjectivesOf(
    course.id,
    (clos.data?.clos ?? []).map((c) => c.id),
  )
  const [form, setForm] = useState<Activity | "new" | null>(null)
  const [deleting, setDeleting] = useState<Activity | null>(null)
  const remove = useDeleteActivity()
  const duplicate = useDuplicateActivity()
  const reorder = useReorderActivities(course.id)
  const mode = useSetWeightMode(course.id)
  const setCloWeights = useSetCloWeights()

  const activities = list.data?.activities ?? []
  const meta = list.data?.meta
  const byGroup = meta?.weightMode === "GROUP"
  const failed = (err: Error) => toast.error(err.message)
  const shown = (p: Promise<unknown>) =>
    p.catch((err: Error) => {
      failed(err)
      throw err
    })

  const objectiveText = new Map(
    objectives.flatMap((q) => (q.data ?? []).map((o) => [o.id, o.description] as const)),
  )
  const ready = !!(list.data && criteria.data && clos.data)

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= activities.length) return
    const order = activities.map((a) => a.id)
    ;[order[i], order[j]] = [order[j]!, order[i]!]
    reorder.mutate(order, { onError: failed })
  }

  /** GROUP ⇄ MANUAL (N1): the weights already there are carried over as the starting point. */
  const switchMode = (next: "MANUAL" | "GROUP") => {
    if (next === (byGroup ? "GROUP" : "MANUAL")) return
    const weights: Record<string, number> = {}
    for (const g of typeGroups(activities))
      weights[g.key] = Math.round(g.items.reduce((t, a) => t + a.weight, 0) * 100) / 100
    mode.mutate(next === "GROUP" ? { mode: "GROUP", weights } : { mode: "MANUAL" }, {
      onError: failed,
    })
  }
  const setGroupWeight = (key: string, weight: number) =>
    shown(mode.mutateAsync({ mode: "GROUP", weights: { ...meta!.groupWeights, [key]: weight } }))

  const syncCloWeights = () => {
    const rows = (clos.data?.clos ?? []).filter(
      (c) => Math.abs((c.weight ?? 0) - c.computedWeight) >= 0.5,
    )
    setCloWeights.mutate(
      rows.map((c) => ({ cloId: c.id, weight: c.computedWeight })),
      { onSuccess: () => toast.success("ใช้ค่าที่คำนวณได้แล้ว"), onError: failed },
    )
  }

  const title = view === "list" ? "กิจกรรมและวิธีประเมิน" : "ตรวจการเชื่อมกับ CLO"
  const addButton = write && (
    <button type="button" className="btn btn-primary" onClick={() => setForm("new")}>
      เพิ่มกิจกรรม
    </button>
  )
  const help =
    view === "list" ? (
      <>น้ำหนักของทุกกิจกรรมต้องรวมได้ 100% · แต่ละกิจกรรมต้องวัดจุดประสงค์อย่างน้อย 1 ข้อ</>
    ) : (
      <>
        ช่อง = % ของกิจกรรมที่ใช้วัด CLO นั้น · ทุกแถวต้องรวมได้ 100% · แถวล่างเทียบน้ำหนัก CLO
        ที่คำนวณจากกิจกรรมกับที่ตั้งไว้ตามแผน
      </>
    )

  const row = (a: Activity, i: number) => {
    const links = (criteria.data?.cells ?? []).filter((c) => c.activityId === a.id)
    const sum = criteria.data?.meta.activityWeightSums[a.id] ?? 0
    return (
      <tr key={a.id}>
        <td>
          {write && (
            <div className="no-print flex items-center gap-1">
              <span className="flex flex-col">
                <button
                  type="button"
                  className="btn btn-quiet !px-1 !py-0"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || reorder.isPending}
                  aria-label={`เลื่อน ${a.name} ขึ้น`}
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="btn btn-quiet !px-1 !py-0"
                  onClick={() => move(i, 1)}
                  disabled={i === activities.length - 1 || reorder.isPending}
                  aria-label={`เลื่อน ${a.name} ลง`}
                >
                  ▼
                </button>
              </span>
              <span className="tnum text-[13px] text-dim">{String(i + 1).padStart(2, "0")}</span>
            </div>
          )}
        </td>
        <td className="wrapcell">
          <div className="text-[14px]">{a.name}</div>
          {a.criteriaNote && <div className="text-[13px] text-dim">{a.criteriaNote}</div>}
          {a.closedAt && (
            <div className="text-[12.5px] text-dim">
              ปิดรับคะแนนแล้ว · <span className="tnum">{a.closedAt.slice(0, 10)}</span>
            </div>
          )}
        </td>
        <td>
          <div className="text-[14px]">{typeText(a)}</div>
          <div className="text-[13px] text-dim">{methodText(a) || "—"}</div>
        </td>
        <td className="num tnum text-[14px]">{n2(a.maxScore)}</td>
        <td className="num tnum text-[14px]">
          {n2(a.passScore)}
          <span className="block text-[12.5px] text-dim">{n2(a.passMark)}%</span>
        </td>
        <td className="num tnum text-[14px]">
          {n2(a.weight)}%{byGroup && <span className="block text-[12.5px] text-dim">จากกลุ่ม</span>}
          {a.weight <= 0 && (
            <span
              className="block text-[12.5px] text-warn"
              title="น้ำหนัก 0 — คะแนนของกิจกรรมนี้ยังไม่เข้าคะแนนรวมและคะแนน CLO"
            >
              ยังไม่เข้าการคำนวณ
            </span>
          )}
        </td>
        <td>
          <div className="flex flex-wrap gap-1.5">
            {links.length ? (
              <>
                {links.map((c) => {
                  const o = criteria.data?.objectives.find((x) => x.id === c.objectiveId)
                  return <Pill key={c.objectiveId}>{`${o?.label ?? "?"} · ${n2(c.weight)}%`}</Pill>
                })}
                {!near100(sum) && <Chip tone="bad">รวม {n2(sum)}%</Chip>}
              </>
            ) : (
              write && (
                <button
                  type="button"
                  className="text-[13px] text-bad underline underline-offset-2"
                  onClick={() => setForm(a)}
                >
                  ยังไม่ผูกจุดประสงค์
                </button>
              )
            )}
          </div>
        </td>
        <td className="no-print">
          {write && (
            <div className="flex justify-end gap-0.5">
              <button type="button" className="btn btn-quiet" onClick={() => setForm(a)}>
                แก้ไข
              </button>
              <button
                type="button"
                className="btn btn-quiet"
                disabled={duplicate.isPending}
                onClick={() =>
                  duplicate.mutate(a.id, {
                    onSuccess: () => toast.success(`ทำสำเนา ${a.name} แล้ว`),
                    onError: failed,
                  })
                }
              >
                ทำสำเนา
              </button>
              <button
                type="button"
                className="btn btn-quiet btn-danger"
                onClick={() => setDeleting(a)}
              >
                ลบ
              </button>
            </div>
          )}
        </td>
      </tr>
    )
  }

  let body
  if (!ready) body = <div className="text-[14px] text-dim">กำลังโหลด…</div>
  else if (view === "matrix")
    body = (
      <CriteriaMatrix
        courseId={course.id}
        criteria={criteria.data!}
        activities={activities}
        clos={clos.data!.clos}
        weightsComplete={near100(criteria.data!.meta.totalWeight)}
        canWrite={write}
        onSyncWeights={syncCloWeights}
      />
    )
  else if (activities.length === 0)
    body = (
      <div className="card px-6 py-10 text-center">
        <div className="text-[16px] text-ink">ยังไม่มีกิจกรรม</div>
        <div className="mt-1.5 text-[14px] text-dim">
          กิจกรรมคือที่มาของคะแนน · น้ำหนักของทุกกิจกรรมต้องรวมได้ 100%
        </div>
        {write && (
          <button type="button" className="btn btn-primary mt-4" onClick={() => setForm("new")}>
            เพิ่มกิจกรรมแรก
          </button>
        )}
      </div>
    )
  else {
    const total = meta!.totalWeight
    body = (
      <>
        <div className="card scroll-x">
          <table className="dt" style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                <th style={{ width: 56 }} />
                <th style={{ minWidth: 260 }}>กิจกรรม</th>
                <th style={{ width: 150 }}>ประเภท · วิธีประเมิน</th>
                <th className="num" style={{ width: 92 }}>
                  คะแนนเต็ม
                </th>
                <th
                  className="num"
                  style={{ width: 104 }}
                  title="คะแนนที่ถือว่าผ่านกิจกรรมนี้ และค่าเดียวกันคิดเป็น % ของคะแนนเต็ม"
                >
                  คะแนนผ่าน
                </th>
                <th
                  className="num"
                  style={{ width: 96 }}
                  title={
                    byGroup
                      ? "น้ำหนักกลุ่ม × คะแนนเต็มกิจกรรมนี้ ÷ คะแนนเต็มรวมของกลุ่ม"
                      : undefined
                  }
                >
                  สัดส่วน
                </th>
                <th style={{ minWidth: 300 }}>วัดจุดประสงค์</th>
                <th className="no-print" style={{ width: 200 }} />
              </tr>
            </thead>
            <tbody>
              {typeGroups(activities).flatMap((g) => {
                const pts = g.items.reduce((t, a) => t + a.maxScore, 0)
                const w = g.items.reduce((t, a) => t + a.weight, 0)
                return [
                  <tr key={`h-${g.key}`} className="cgrouphead">
                    <td colSpan={8}>
                      <div className="flex flex-wrap items-center gap-3">
                        <span>
                          <span className="text-[14px] text-ink">{g.label}</span>
                          <span className="text-[13px] text-dim">
                            {" "}
                            · {g.items.length} กิจกรรม · คะแนนเต็มรวม {n2(pts)}
                            {byGroup ? "" : ` · สัดส่วนรวม ${n2(w)}%`}
                          </span>
                        </span>
                        {byGroup && (
                          <label className="ml-auto flex items-center gap-2 text-[13px] text-dim">
                            น้ำหนักกลุ่ม (%)
                            <InlineNumber
                              value={meta!.groupWeights[g.key] ?? 0}
                              label={`น้ำหนักของกลุ่ม ${g.label} ในวิชา (%)`}
                              width={72}
                              disabled={!write}
                              onSave={(v) => setGroupWeight(groupKey(g.items[0]!), v)}
                            />
                            <span className="tnum">÷ {g.items.length} กิจกรรมตามคะแนนเต็ม</span>
                          </label>
                        )}
                      </div>
                    </td>
                  </tr>,
                  ...g.items.map((a) =>
                    row(
                      a,
                      activities.findIndex((x) => x.id === a.id),
                    ),
                  ),
                ]
              })}
            </tbody>
          </table>
        </div>
        <div className="card mt-4 flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          <span className={`text-[14px] ${near100(total) ? "text-ok" : "text-bad"}`}>
            สัดส่วนคะแนนรวม <span className="tnum">{n2(total)}%</span>
            {near100(total)
              ? " — ครบแล้ว"
              : " — ต้องเท่ากับ 100% (ยังไม่ครบบันทึกได้แต่ยังคำนวณผลไม่ได้)"}
          </span>
          {write && (
            <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
              <span className="text-dim">กรอกสัดส่วนคะแนน</span>
              <button
                type="button"
                className="chipbtn"
                aria-current={byGroup ? "true" : undefined}
                disabled={mode.isPending}
                onClick={() => switchMode("GROUP")}
              >
                ต่อกลุ่มประเภท
              </button>
              <button
                type="button"
                className="chipbtn"
                aria-current={byGroup ? undefined : "true"}
                disabled={mode.isPending}
                onClick={() => switchMode("MANUAL")}
              >
                ทีละกิจกรรม
              </button>
              <Tip
                text={
                  "ต่อกลุ่มประเภท: กรอกที่หัวกลุ่ม ระบบแบ่งให้กิจกรรมในกลุ่มตามคะแนนเต็ม\nทีละกิจกรรม: กรอกในฟอร์มของแต่ละกิจกรรม"
                }
              />
            </div>
          )}
        </div>
      </>
    )
  }

  const deleteRows: [string, number][] = deleting
    ? [
        [
          "การเชื่อมกับจุดประสงค์",
          (criteria.data?.cells ?? []).filter((c) => c.activityId === deleting.id).length,
        ],
        ["นักศึกษาที่มีคะแนนในกิจกรรมนี้", deleting.scoredCount],
      ]
    : []

  return (
    <CoursePage title={title} tools={addButton} help={help}>
      <SubTabs
        tabs={TABS}
        value={view}
        onChange={(v) => setParams(v === "list" ? {} : { view: v }, { replace: true })}
      />
      <div className="mt-4">{body}</div>
      {form && ready && (
        <ActivityForm
          courseId={course.id}
          activity={form === "new" ? null : form}
          activities={activities}
          meta={meta!}
          clos={clos.data!.clos}
          criteria={criteria.data!}
          objectiveText={objectiveText}
          onClose={() => setForm(null)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          title={`ลบกิจกรรม — ${deleting.name}`}
          label="ลบกิจกรรม"
          rows={deleteRows}
          note="คะแนนของกิจกรรมนี้จะหายทั้งหมด และผลการประเมินจะคำนวณใหม่"
          pending={remove.isPending}
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            remove.mutate(deleting.id, {
              onSuccess: () => {
                toast.success(`ลบกิจกรรม ${deleting.name} แล้ว`)
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
