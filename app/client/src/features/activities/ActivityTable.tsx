import { InlineNumber } from "../../components/ui/InlineNumber.tsx"
import { n2 } from "../clos/useClos.ts"
import type { Activity, ActivityListMeta, Criteria, CriteriaMeta } from "./activity.types.ts"
import { groupKey, typeGroups } from "./activityView.ts"
import { ActivityTableRow } from "./ActivityTableRow.tsx"

/** The activity list, one block per type; in GROUP mode a group's weight is typed at its head (N1). */
export function ActivityTable({
  activities,
  meta,
  criteria,
  write,
  reordering,
  duplicating,
  onMove,
  onEdit,
  onDuplicate,
  onDelete,
  onGroupWeight,
}: {
  activities: Activity[]
  meta: ActivityListMeta
  criteria: Criteria & { meta: CriteriaMeta }
  write: boolean
  reordering: boolean
  duplicating: boolean
  onMove: (i: number, dir: -1 | 1) => void
  onEdit: (a: Activity) => void
  onDuplicate: (a: Activity) => void
  onDelete: (a: Activity) => void
  onGroupWeight: (key: string, weight: number) => Promise<unknown>
}) {
  const byGroup = meta.weightMode === "GROUP"
  return (
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
              byGroup ? "น้ำหนักกลุ่ม × คะแนนเต็มกิจกรรมนี้ ÷ คะแนนเต็มรวมของกลุ่ม" : undefined
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
                        value={meta.groupWeights[g.key] ?? 0}
                        label={`น้ำหนักของกลุ่ม ${g.label} ในวิชา (%)`}
                        width={72}
                        disabled={!write}
                        onSave={(v) => onGroupWeight(groupKey(g.items[0]!), v)}
                      />
                      <span className="tnum">÷ {g.items.length} กิจกรรมตามคะแนนเต็ม</span>
                    </label>
                  )}
                </div>
              </td>
            </tr>,
            ...g.items.map((a) => (
              <ActivityTableRow
                key={a.id}
                a={a}
                i={activities.findIndex((x) => x.id === a.id)}
                count={activities.length}
                criteria={criteria}
                write={write}
                byGroup={byGroup}
                reordering={reordering}
                duplicating={duplicating}
                onMove={onMove}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            )),
          ]
        })}
      </tbody>
    </table>
  )
}
