import { Chip, Pill } from "../../components/ui/Badges.tsx"
import { n2, near100 } from "../clos/useClos.ts"
import type { Activity, Criteria, CriteriaMeta } from "./activity.types.ts"
import { methodText, typeText } from "./activityView.ts"

/** One activity in the list: order arrows, name, type, scores, weight, the objectives it measures, and its actions. */
export function ActivityTableRow({
  a,
  i,
  count,
  criteria,
  write,
  byGroup,
  reordering,
  duplicating,
  onMove,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  a: Activity
  /** Its position in the whole list (not within its group). */
  i: number
  /** How many activities there are in all. */
  count: number
  criteria: Criteria & { meta: CriteriaMeta }
  write: boolean
  byGroup: boolean
  reordering: boolean
  duplicating: boolean
  onMove: (i: number, dir: -1 | 1) => void
  onEdit: (a: Activity) => void
  onDuplicate: (a: Activity) => void
  onDelete: (a: Activity) => void
}) {
  const links = criteria.cells.filter((c) => c.activityId === a.id)
  const sum = criteria.meta.activityWeightSums[a.id] ?? 0
  return (
    <tr>
      <td>
        {write && (
          <div className="no-print flex items-center gap-1">
            <span className="flex flex-col">
              <button
                type="button"
                className="btn btn-quiet !px-1 !py-0"
                onClick={() => onMove(i, -1)}
                disabled={i === 0 || reordering}
                aria-label={`เลื่อน ${a.name} ขึ้น`}
              >
                ▲
              </button>
              <button
                type="button"
                className="btn btn-quiet !px-1 !py-0"
                onClick={() => onMove(i, 1)}
                disabled={i === count - 1 || reordering}
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
                const o = criteria.objectives.find((x) => x.id === c.objectiveId)
                return <Pill key={c.objectiveId}>{`${o?.label ?? "?"} · ${n2(c.weight)}%`}</Pill>
              })}
              {!near100(sum) && <Chip tone="bad">รวม {n2(sum)}%</Chip>}
            </>
          ) : (
            write && (
              <button
                type="button"
                className="text-[13px] text-bad underline underline-offset-2"
                onClick={() => onEdit(a)}
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
            <button type="button" className="btn btn-quiet" onClick={() => onEdit(a)}>
              แก้ไข
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              disabled={duplicating}
              onClick={() => onDuplicate(a)}
            >
              ทำสำเนา
            </button>
            <button type="button" className="btn btn-quiet btn-danger" onClick={() => onDelete(a)}>
              ลบ
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
