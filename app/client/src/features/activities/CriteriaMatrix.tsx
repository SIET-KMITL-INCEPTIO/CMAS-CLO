/**
 * The "ตรวจการเชื่อมกับ CLO" tab (index-q viewActivities, matrix): one row per
 * activity, one column per CLO that has objectives, each cell the % of the
 * activity that measures that CLO. Rows must sum to 100; the foot compares the
 * weight each CLO gets from the activities with the weight planned for it (E2).
 * Cells are stored per objective — criteriaMath does the conversion.
 */
import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Tip } from "../../components/page/PageHeader.tsx"
import { TONE } from "../../components/ui/tone.ts"
import type { Clo } from "../clos/clo.types.ts"
import { n2, near100 } from "../clos/useClos.ts"
import type { Activity, Criteria, CriteriaMeta } from "./activity.types.ts"
import { methodText, typeGroups } from "./activityView.ts"
import { cloShare, evenRow, setCloShare } from "./criteriaMath.ts"
import { useReplaceCriteria } from "./useActivities.ts"

type Props = {
  courseId: string
  criteria: Criteria & { meta: CriteriaMeta }
  activities: Activity[]
  clos: Clo[]
  weightsComplete: boolean
  canWrite: boolean
  onSyncWeights: () => void
}

/** One cell: edits on Enter / blur, empty unlinks, Esc puts the saved value back. */
function Cell({
  value,
  label,
  title,
  disabled,
  onSave,
}: {
  value: number | null
  label: string
  title: string
  disabled: boolean
  onSave: (v: number | null) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = value === null ? "" : String(value)
  const text = draft ?? shown
  const bad = draft !== null && draft.trim() !== "" && !(Number(draft) > 0 && Number(draft) <= 100)
  const commit = () => {
    if (draft === null) return
    const v = draft.trim() === "" ? null : Number(draft)
    if (!bad && v !== value) onSave(v)
    setDraft(null)
  }
  return (
    <input
      className={`cellinp ${value === null ? "empty" : ""}`}
      value={text}
      placeholder="–"
      inputMode="decimal"
      aria-label={label}
      aria-invalid={bad || undefined}
      title={title}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur()
        if (e.key === "Escape") {
          setDraft(null)
          e.currentTarget.blur()
        }
      }}
    />
  )
}

export function CriteriaMatrix({
  courseId,
  criteria,
  activities,
  clos,
  weightsComplete,
  canWrite,
  onSyncWeights,
}: Props) {
  const replace = useReplaceCriteria(courseId)
  const { cells, objectives, meta } = criteria
  const cols = clos.filter((c) => objectives.some((o) => o.cloId === c.id))
  const write = (next: typeof cells) =>
    replace.mutate(next, { onError: (err) => toast.error(err.message) })

  const rowSum = (id: string) => meta.activityWeightSums[id] ?? 0
  const unlinked = activities.filter((a) => meta.unlinkedActivityIds.includes(a.id))
  const partial = activities.filter((a) => !near100(rowSum(a.id)) && rowSum(a.id) !== 0)
  const unmeasured = objectives.filter((o) => meta.unmeasuredObjectiveIds.includes(o.id))
  const problems = [
    unlinked.length ? `ยังไม่ผูก CLO: ${unlinked.map((a) => a.name).join(" · ")}` : "",
    partial.length
      ? `สัดส่วนยังไม่ครบ 100%: ${partial.map((a) => `${a.name} รวมได้ ${n2(rowSum(a.id))}%`).join(" · ")}`
      : "",
    unmeasured.length
      ? `จุดประสงค์ที่ยังไม่มีกิจกรรมวัด: ${unmeasured.map((o) => o.label).join(", ")} — เลือกในฟอร์ม “แก้ไข” ของกิจกรรมที่วัดข้อนั้น`
      : "",
  ].filter(Boolean)
  const gap = cols.filter((c) => Math.abs((c.weight ?? 0) - c.computedWeight) >= 0.5)
  const sumBad = !near100(meta.totalWeight)

  if (cols.length === 0)
    return (
      <div className="card px-6 py-10 text-center">
        <div className="text-[16px] text-ink">ยังไม่มีจุดประสงค์ให้เชื่อม</div>
        <div className="mt-1.5 text-[14px] text-dim">
          CLO ต้องมีจุดประสงค์อย่างน้อย 1 ข้อจึงจะเชื่อมกิจกรรมได้ — กำหนดจุดประสงค์ก่อน
        </div>
        <Link className="btn btn-primary mt-4 inline-block" to={`/courses/${courseId}/objectives`}>
          ไปหน้าจุดประสงค์
        </Link>
      </div>
    )

  const tone = problems.length ? "bad" : sumBad || gap.length ? "warn" : "ok"
  const message = problems.length
    ? null
    : sumBad
      ? `เชื่อมครบ · แต่น้ำหนักกิจกรรมรวม ${n2(meta.totalWeight)}% ยังไม่เท่ากับ 100% — แก้ที่หน้ากิจกรรม`
      : gap.length
        ? "เชื่อมครบ · น้ำหนัก CLO ไม่ตรงกับแผน: " +
          gap
            .map(
              (c) => `CLO ${c.number} คำนวณ ${n2(c.computedWeight)}% / แผน ${n2(c.weight ?? 0)}%`,
            )
            .join(" · ")
        : "เชื่อมครบทุกกิจกรรม และน้ำหนัก CLO ตรงกับแผน"

  return (
    <>
      <div
        className="mb-4 flex flex-wrap items-center gap-3 rounded-lg px-5 py-3 text-[14px]"
        style={{ background: TONE[tone].bg, color: TONE[tone].tx }}
      >
        <div className="min-w-[240px] flex-1">
          {problems.length ? (
            <>
              <span className="mr-2">⚠</span>
              {problems.map((p) => (
                <div key={p}>{p}</div>
              ))}
            </>
          ) : (
            message
          )}
        </div>
        {!problems.length && !sumBad && gap.length > 0 && canWrite && (
          <button type="button" className="btn btn-quiet no-print" onClick={onSyncWeights}>
            ใช้ค่าที่คำนวณได้ทุกข้อ
          </button>
        )}
      </div>
      <div className="mb-2.5 flex flex-wrap items-center gap-2 text-[14px] text-ink2">
        <span>แต่ละแถวต้องรวมได้ 100% · แก้ในช่องได้ · ล้างช่อง = เลิกผูก</span>
        <Tip
          text={
            "ช่อง = % ของกิจกรรมที่วัด CLO นั้น (รวมทุกจุดประสงค์ใต้ CLO)\nแก้ค่า = ปรับยอดรวม คงสัดส่วนระหว่างจุดประสงค์เดิม\nผูกครั้งแรกจากช่องนี้ = แบ่งให้ทุกจุดประสงค์ตามน้ำหนัก"
          }
        />
      </div>
      <div className="card scroll-x">
        <table className="dt">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white">กิจกรรม</th>
              {cols.map((c) => (
                <th key={c.id} className="num" title={c.description}>
                  CLO {c.number}
                  <div className="tnum font-normal tracking-normal text-faint normal-case">
                    % ของกิจกรรม
                  </div>
                </th>
              ))}
              <th className="num" style={{ width: 104 }}>
                รวมแถว
              </th>
            </tr>
          </thead>
          <tbody>
            {typeGroups(activities).flatMap((g) => [
              <tr key={`h-${g.key}`} className="cgrouphead">
                <td colSpan={cols.length + 2}>
                  <span className="text-[14px] text-ink">{g.label}</span>
                  <span className="text-[13px] text-dim">
                    {" "}
                    · {g.items.length} กิจกรรม · สัดส่วนรวม{" "}
                    {n2(g.items.reduce((t, a) => t + a.weight, 0))}%
                  </span>
                </td>
              </tr>,
              ...g.items.map((a) => {
                const rs = rowSum(a.id)
                return (
                  <tr key={a.id}>
                    <td className="who sticky left-0 z-10 bg-white">
                      <span className="nm block !max-w-[240px]">{a.name}</span>
                      <span className="code">
                        {methodText(a)} · {n2(a.weight)}% ของวิชา
                      </span>
                    </td>
                    {cols.map((c) => {
                      const v = cloShare(cells, objectives, a.id, c.id)
                      return (
                        <td
                          key={c.id}
                          className="num"
                          style={{
                            background: v
                              ? `rgba(92,92,120,${(0.05 + (v / 100) * 0.3).toFixed(3)})`
                              : undefined,
                          }}
                        >
                          <Cell
                            value={v}
                            label={`สัดส่วนของ ${a.name} ที่วัด CLO ${c.number}${v === null ? " (ยังไม่ได้ผูก)" : ""}`}
                            title={`${a.name} → CLO ${c.number}`}
                            disabled={!canWrite}
                            onSave={(next) =>
                              write(setCloShare(cells, objectives, a.id, c.id, next))
                            }
                          />
                        </td>
                      )
                    })}
                    <td
                      className={`num tnum text-[14px] ${near100(rs) ? "text-dim" : "text-bad font-medium"}`}
                    >
                      {n2(rs)}%{near100(rs) ? " ✓" : ""}
                      {canWrite && rs !== 0 && !near100(rs) && (
                        <button
                          type="button"
                          className="no-print mt-1 ml-auto block text-[12.5px] text-dim underline underline-offset-2"
                          onClick={() => write(evenRow(cells, objectives, a.id))}
                        >
                          แบ่งเท่ากัน
                        </button>
                      )}
                    </td>
                  </tr>
                )
              }),
            ])}
            <tr>
              <td className="sticky left-0 z-10 bg-wash">
                <div className="flex items-center gap-2">
                  <span className="over">น้ำหนัก CLO ในวิชา</span>
                  <Tip
                    text={
                      "คำนวณ = Σ (น้ำหนักกิจกรรม × % ในช่องของ CLO นั้น)\nเทียบกับน้ำหนักตามแผนในหน้า CLO — ต่างกันตั้งแต่ 0.5% เตือน"
                    }
                  />
                </div>
                <div className="mt-1 text-[13px] text-soft normal-case">คำนวณ / ตามแผน</div>
              </td>
              {cols.map((c) => {
                const bad = Math.abs((c.weight ?? 0) - c.computedWeight) >= 0.5
                return (
                  <td key={c.id} className="num tnum">
                    <span className={`text-[14px] font-medium ${bad ? "text-warn" : ""}`}>
                      {n2(c.computedWeight)}%
                    </span>
                    <span className="text-[13px] text-dim"> / {n2(c.weight ?? 0)}%</span>
                    {bad ? <span className="text-warn"> ≠</span> : " ✓"}
                  </td>
                )
              })}
              <td className="num tnum text-[14px] font-medium">
                {n2(clos.reduce((t, c) => t + c.computedWeight, 0))}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {!weightsComplete && null}
    </>
  )
}
