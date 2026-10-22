/**
 * Weight arithmetic shared by CLOs, the criteria matrix and the activity
 * group weights. Pure functions: no I/O, so every rule here is unit-tested.
 *
 *   course total = Σ Activity.weight                         (should be 100)
 *   activity     = Σ AssessmentCriteria.weight per activity  (should be 100)
 *   CLO share    = Σ_activity weight × Σ_{objective of CLO} criteria% / 100   (CR-02)
 */

/** Two weights this close are equal: they are typed with at most a few decimals. */
export const SAME = 0.01
export const near = (a: number, b: number) => Math.abs(a - b) < SAME
export const round2 = (n: number) => Math.round(n * 100) / 100

type ActivityW = { id: string; weight: number }
type CellW = { activityId: string; objectiveId: string; weight: number }

/** CR-02: the share of the course total each CLO is actually measured by. */
export function computedCloWeights(
  activities: ActivityW[],
  cells: CellW[],
  cloOfObjective: Map<string, string>,
): Map<string, number> {
  const weightOf = new Map(activities.map((a) => [a.id, a.weight]))
  const out = new Map<string, number>()
  for (const cell of cells) {
    const cloId = cloOfObjective.get(cell.objectiveId)
    const activityWeight = weightOf.get(cell.activityId)
    if (!cloId || activityWeight === undefined) continue
    out.set(cloId, (out.get(cloId) ?? 0) + (activityWeight * cell.weight) / 100)
  }
  for (const [k, v] of out) out.set(k, round2(v))
  return out
}

/** Σ criteria weight per activity (FR-45: each should be 100). */
export function sumBy<T>(rows: T[], key: (r: T) => string, value: (r: T) => number) {
  const out = new Map<string, number>()
  for (const r of rows) out.set(key(r), round2((out.get(key(r)) ?? 0) + value(r)))
  return out
}

/** The group an activity's weight comes from in GROUP mode (N1/N2). */
export const groupKey = (a: { type: string; typeLabel: string }) =>
  a.type === "CUSTOM" ? `CUSTOM:${a.typeLabel}` : a.type

/**
 * GROUP mode: each group's weight is split over its activities in proportion
 * to maxScore. Rounded to 2 decimals, with the rounding remainder put on the
 * group's last activity so the group still sums to exactly its weight.
 */
export function splitGroupWeights(
  activities: { id: string; type: string; typeLabel: string; maxScore: number }[],
  groups: Record<string, number>,
): Map<string, number> {
  const out = new Map<string, number>()
  const byGroup = new Map<string, typeof activities>()
  for (const a of activities) {
    const k = groupKey(a)
    byGroup.set(k, [...(byGroup.get(k) ?? []), a])
  }
  for (const [k, members] of byGroup) {
    const total = groups[k] ?? 0
    const max = members.reduce((s, a) => s + a.maxScore, 0)
    let given = 0
    members.forEach((a, i) => {
      const w =
        i === members.length - 1 ? round2(total - given) : round2((total * a.maxScore) / max)
      given = round2(given + w)
      out.set(a.id, w)
    })
  }
  return out
}
