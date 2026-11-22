import { n2 } from "../clos/useClos.ts"
import type { Clo } from "../clos/clo.types.ts"
import type { Criteria } from "./activity.types.ts"

/** T4: which objectives the activity measures, and its share of each (the shares add up to 100). */
export function ObjectivePicker({
  groups,
  ticked,
  objectiveText,
  error,
  onToggle,
  onShare,
}: {
  groups: { clo: Clo; objs: Criteria["objectives"] }[]
  /** objectiveId → the share typed for it; an objective is ticked when it has a key here. */
  ticked: Record<string, string>
  /** objectiveId → its description. */
  objectiveText: Map<string, string>
  error?: string
  onToggle: (objectiveId: string) => void
  onShare: (objectiveId: string, value: string) => void
}) {
  const sum = Object.values(ticked).reduce((s, v) => s + (Number(v) || 0), 0)
  return (
    <fieldset>
      <legend className="mb-1.5 text-[14px] text-ink2">
        วัดจุดประสงค์ข้อใด และสัดส่วนของกิจกรรม (%) <span className="text-bad">*</span>
      </legend>
      <div className="space-y-3 rounded-sm border border-edge p-3">
        {groups.map((g) => (
          <div key={g.clo.id}>
            <div className="mb-1 text-[13px] text-dim">CLO {g.clo.number}</div>
            {g.objs.map((o) => {
              const on = o.id in ticked
              return (
                <div key={o.id} className="flex items-center gap-2 py-0.5">
                  <label className="flex min-w-0 flex-1 items-start gap-2 text-[14px]">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={on}
                      onChange={() => onToggle(o.id)}
                    />
                    <span className="min-w-0">
                      <span className="tnum text-dim">{o.label}</span>{" "}
                      {objectiveText.get(o.id) ?? ""}
                    </span>
                  </label>
                  {on && (
                    <input
                      className="inp tnum !w-20 !px-2 !py-1 text-right text-[14px]"
                      inputMode="decimal"
                      value={ticked[o.id]}
                      aria-label={`สัดส่วนของ ${o.label} (%)`}
                      onChange={(e) => onShare(o.id, e.target.value)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        ))}
        <div className={`tnum text-[13px] ${Math.abs(sum - 100) < 0.01 ? "text-ok" : "text-dim"}`}>
          รวม {n2(sum)}%{Math.abs(sum - 100) < 0.01 ? " ✓" : " — ต้องรวมได้ 100%"}
        </div>
      </div>
      {error && <div className="ferr">{error}</div>}
    </fieldset>
  )
}
