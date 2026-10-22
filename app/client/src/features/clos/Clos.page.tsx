/**
 * ผลลัพธ์การเรียนรู้ระดับรายวิชา (CLO) — viewClos of index-q.html: one card per
 * CLO with its levels, its objectives' state, and the planned weight beside
 * the weight the activities actually give it (E2). A gap warns, never blocks.
 */
import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Tip } from "../../components/page/PageHeader.tsx"
import { Chip } from "../../components/ui/Badges.tsx"
import { InlineNumber } from "../../components/ui/InlineNumber.tsx"
import { useCan } from "../../hooks/useCan.ts"
import { useCriteria } from "../activities/useActivities.ts"
import { CoursePage } from "../courses/CoursePage.tsx"
import { useCourseContext } from "../courses/useCourseContext.ts"
import type { Clo } from "./clo.types.ts"
import { CloForm } from "./CloForm.tsx"
import { ConfirmDelete } from "./ConfirmDelete.tsx"
import { BloomChip, SoloChip } from "./LevelChips.tsx"
import {
  n2,
  near100,
  useCloList,
  useDeleteClo,
  usePatchClo,
  useReorderClos,
  useSetCloPassMark,
  useSetCloWeights,
} from "./useClos.ts"

const TITLE = "ผลลัพธ์การเรียนรู้ระดับรายวิชา (CLO)"
const GAP = 0.5 // E2: planned and computed this far apart or more warns

export default function Clos() {
  const { course } = useCourseContext()
  const can = useCan(course)
  const write = can("clo.write")
  const list = useCloList(course.id)
  const criteria = useCriteria(course.id)
  const [editing, setEditing] = useState<Clo | "new" | null>(null)
  const [deleting, setDeleting] = useState<Clo | null>(null)
  const patch = usePatchClo()
  const reorder = useReorderClos(course.id)
  const remove = useDeleteClo()
  const passMark = useSetCloPassMark(course.id)
  const setWeights = useSetCloWeights()

  const clos = list.data?.clos ?? []
  const meta = criteria.data?.meta
  const cells = criteria.data?.cells ?? []
  const objectives = criteria.data?.objectives ?? []
  // The computed weight is trustworthy only once the matrix and activity weights are complete.
  const canSync =
    !!meta &&
    near100(meta.totalWeight) &&
    criteria.data!.activities.every((a) => near100(meta.activityWeightSums[a.id] ?? 0))
  const gapOf = (c: Clo) => Math.abs((c.weight ?? 0) - c.computedWeight) >= GAP
  const gaps = clos.filter(gapOf)
  const sum = list.data?.meta.weightSum ?? 0

  const failed = (err: Error) => toast.error(err.message)
  /** For the inline boxes: the box needs the promise, the reader needs the message. */
  const shown = (p: Promise<unknown>) =>
    p.catch((err: Error) => {
      failed(err)
      throw err
    })
  const saveWeight = (c: Clo, weight: number) =>
    shown(patch.mutateAsync({ cloId: c.id, body: { weight } }))
  const sync = (rows: Clo[]) =>
    setWeights.mutate(
      rows.map((c) => ({ cloId: c.id, weight: c.computedWeight })),
      { onSuccess: () => toast.success("ใช้ค่าที่คำนวณได้แล้ว"), onError: failed },
    )
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= clos.length) return
    const order = clos.map((c) => c.id)
    ;[order[i], order[j]] = [order[j]!, order[i]!]
    reorder.mutate(order, { onError: failed })
  }

  const addButton = write && (
    <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>
      เพิ่ม CLO
    </button>
  )
  const help = (
    <>
      น้ำหนักตามแผนควรรวมได้ 100% · เป็นค่าที่ใช้เทียบกับน้ำหนักที่คำนวณจากกิจกรรม ไม่เข้าสูตรคะแนน
      · ระดับ SOLO ตามระดับ Bloom ให้เองเมื่อเลือก “อัตโนมัติ”
    </>
  )

  let body
  if (list.isLoading) body = <div className="text-[14px] text-dim">กำลังโหลด CLO…</div>
  else if (clos.length === 0)
    body = (
      <div className="card px-6 py-10 text-center">
        <div className="text-[16px] text-ink">ยังไม่มี CLO ในรายวิชานี้</div>
        <div className="mt-1.5 text-[14px] text-dim">
          เริ่มจาก CLO — จุดประสงค์ กิจกรรม และผลการประเมินอ้างอิงกลับมาที่นี่
        </div>
        {write && (
          <button type="button" className="btn btn-primary mt-4" onClick={() => setEditing("new")}>
            เพิ่ม CLO ข้อแรก
          </button>
        )}
      </div>
    )
  else
    body = (
      <>
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-2 text-[14px] text-ink2">
              น้ำหนักตามแผนรวมของทุก CLO
              <Tip text="ใช้เทียบกับน้ำหนักที่คำนวณจากกิจกรรม ไม่เข้าสูตรคะแนน · เตือนเมื่อต่างกันตั้งแต่ 0.5%" />
            </span>
            <span className={`tnum text-[14px] ${near100(sum) ? "text-ok" : "text-warn"}`}>
              {n2(sum)}%{near100(sum) ? " ✓" : " — ควรรวมได้ 100%"}
            </span>
            {write && canSync && gaps.length > 0 && (
              <button
                type="button"
                className="btn btn-quiet no-print"
                onClick={() => sync(gaps)}
                disabled={setWeights.isPending}
                title="ตั้งน้ำหนักตามแผนของทุก CLO ให้เท่ากับค่าที่คำนวณจากกิจกรรม"
              >
                ใช้ค่าที่คำนวณได้ทุกข้อ
              </button>
            )}
          </div>
          <div className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-2 text-[14px] text-ink2">
              เกณฑ์ผ่าน CLO ของรายวิชา (%)
              <Tip text="นักศึกษาผ่าน CLO เมื่อคะแนนของข้อนั้นได้ตั้งแต่ค่านี้ · ใช้ค่าเดียวทุกข้อ" />
            </span>
            <InlineNumber
              value={course.cloPassMark}
              label="เกณฑ์ผ่าน CLO ของรายวิชา (%)"
              width={72}
              disabled={!can("course.settings")}
              onSave={(v) => shown(passMark.mutateAsync(v))}
            />
          </div>
        </div>

        <div className="space-y-3">
          {clos.map((c, i) => {
            const objSum = meta?.objectiveWeightSums[c.id] ?? 0
            return (
              <article
                key={c.id}
                className="card flex flex-wrap items-start gap-x-4 gap-y-3 px-4 py-4"
              >
                <div className="flex min-w-[220px] flex-1 basis-[300px] items-start gap-3">
                  {write && (
                    <span className="no-print flex flex-col gap-0.5 pt-0.5">
                      <button
                        type="button"
                        className="btn btn-quiet !px-1.5 !py-0"
                        onClick={() => move(i, -1)}
                        disabled={i === 0 || reorder.isPending}
                        aria-label={`เลื่อน CLO ${c.number} ขึ้น`}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="btn btn-quiet !px-1.5 !py-0"
                        onClick={() => move(i, 1)}
                        disabled={i === clos.length - 1 || reorder.isPending}
                        aria-label={`เลื่อน CLO ${c.number} ลง`}
                      >
                        ▼
                      </button>
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="tnum text-[15px] font-medium">CLO {c.number}</span>
                    <p className="mt-2 text-[16px] leading-relaxed">{c.description}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                      <BloomChip level={c.bloomLevel} />
                      <SoloChip level={c.soloLevel} />
                    </div>
                    {/* T8 — a shortcut to this CLO's objectives that says their state before the click */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[14px]">
                      <Link
                        to={`/courses/${course.id}/objectives?clo=${c.id}`}
                        className="text-ink2 underline underline-offset-2 hover:text-ink"
                      >
                        จุดประสงค์ {c.objectiveCount} ข้อ →
                      </Link>
                      {c.objectiveCount === 0 ? (
                        <Chip tone="bad">ยังไม่มีจุดประสงค์</Chip>
                      ) : !near100(objSum) && meta ? (
                        <Chip tone="bad">น้ำหนักรวม {n2(objSum)}%</Chip>
                      ) : (
                        <span className="text-dim">· น้ำหนักครบ 100%</span>
                      )}
                      {c.objectiveCount > 0 && !c.isMeasured && (
                        <Chip tone="bad">ยังไม่มีกิจกรรมวัด</Chip>
                      )}
                    </div>
                  </div>
                </div>
                <div className="no-print shrink-0" style={{ width: 150 }}>
                  <div className="block text-[12.5px] text-dim">น้ำหนักตามแผน (%)</div>
                  <div className="mt-1">
                    <InlineNumber
                      value={c.weight}
                      label={`น้ำหนักตามแผนของ CLO ${c.number} (%)`}
                      width={84}
                      disabled={!write}
                      onSave={(v) => saveWeight(c, v)}
                    />
                  </div>
                  {/* P3 — say what does not match what: the entered value against the computed one. */}
                  {gapOf(c) && (
                    <div
                      className="mt-1.5 text-[12.5px] text-warn"
                      title="คำนวณจากน้ำหนักกิจกรรม × % ที่กิจกรรมวัด CLO นี้"
                    >
                      ไม่ตรงกับที่คำนวณจากกิจกรรม (
                      <span className="tnum">{n2(c.computedWeight)}%</span>)
                      {write && canSync && (
                        <button
                          type="button"
                          className="mt-0.5 block text-ink2 underline underline-offset-2 hover:text-ink"
                          onClick={() => sync([c])}
                        >
                          ใช้ค่าที่คำนวณได้
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {write && (
                  <div className="no-print flex shrink-0 gap-0.5 self-start">
                    <button type="button" className="btn btn-quiet" onClick={() => setEditing(c)}>
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      className="btn btn-quiet btn-danger"
                      onClick={() => setDeleting(c)}
                    >
                      ลบ
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </>
    )

  const delObjs = deleting ? objectives.filter((o) => o.cloId === deleting.id) : []
  return (
    <CoursePage title={TITLE} tools={addButton} help={help}>
      {body}
      {editing && (
        <CloForm
          courseId={course.id}
          clo={editing === "new" ? null : editing}
          all={clos}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          title={`ลบ CLO — CLO ${deleting.number}`}
          label="ลบ CLO"
          rows={[
            ["จุดประสงค์เชิงพฤติกรรม", deleting.objectiveCount],
            [
              "การเชื่อมกิจกรรมกับจุดประสงค์",
              cells.filter((x) => delObjs.some((o) => o.id === x.objectiveId)).length,
            ],
          ]}
          note="ผลการประเมินที่คำนวณไว้จะเปลี่ยนทันทีหลังลบ · กิจกรรมยังอยู่ แต่สัดส่วนที่เคยวัดจุดประสงค์ของ CLO นี้จะหายไป"
          pending={remove.isPending}
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            remove.mutate(deleting.id, {
              onSuccess: () => {
                toast.success(`ลบ CLO ${deleting.number} แล้ว`)
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
