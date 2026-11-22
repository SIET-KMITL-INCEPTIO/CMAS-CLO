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
import { SubTabs } from "../../components/page/PageHeader.tsx"
import { useCan } from "../../hooks/useCan.ts"
import { ConfirmDelete } from "../clos/ConfirmDelete.tsx"
import { near100, useCloList, useObjectivesOf, useSetCloWeights } from "../clos/useClos.ts"
import { CoursePage } from "../courses/CoursePage.tsx"
import { useCourseContext } from "../courses/useCourseContext.ts"
import type { Activity } from "./activity.types.ts"
import { ActivityForm } from "./ActivityForm.tsx"
import { ActivityTable } from "./ActivityTable.tsx"
import { typeGroups } from "./activityView.ts"
import { CriteriaMatrix } from "./CriteriaMatrix.tsx"
import {
  useActivityList,
  useCriteria,
  useDeleteActivity,
  useDuplicateActivity,
  useReorderActivities,
  useSetWeightMode,
} from "./useActivities.ts"
import { WeightFooter } from "./WeightFooter.tsx"

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

  const duplicateActivity = (a: Activity) =>
    duplicate.mutate(a.id, {
      onSuccess: () => toast.success(`ทำสำเนา ${a.name} แล้ว`),
      onError: failed,
    })

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
    body = (
      <>
        <div className="card scroll-x">
          <ActivityTable
            activities={activities}
            meta={meta!}
            criteria={criteria.data!}
            write={write}
            reordering={reorder.isPending}
            duplicating={duplicate.isPending}
            onMove={move}
            onEdit={setForm}
            onDuplicate={duplicateActivity}
            onDelete={setDeleting}
            onGroupWeight={setGroupWeight}
          />
        </div>
        <WeightFooter
          total={meta!.totalWeight}
          byGroup={byGroup}
          write={write}
          pending={mode.isPending}
          onSwitch={switchMode}
        />
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
