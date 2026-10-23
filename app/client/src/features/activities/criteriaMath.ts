/**
 * The matrix is stored per objective (API cells) but read per CLO (index-q's
 * matrix tab shows one % per activity × CLO). These are the conversions —
 * pure, so the rules (Q7) are tested without a screen.
 *
 *   · a CLO's cell = the sum of that activity's cells on the CLO's objectives
 *   · setting it again keeps the split between objectives, scaled to the new total
 *   · linking it the first time splits by the objectives' own weights
 *   · clearing it removes the activity from every objective of the CLO
 */
import type { Cell, Criteria } from "./activity.types.ts"

type Objective = Criteria["objectives"][number]

const cents = (v: number) => Math.round(v * 100) / 100

/** Largest-remainder split of `total` over `raw` shares to two decimals (index-q splitCents). */
export function splitCents(raw: number[], total: number): number[] {
  const all = Math.round(total * 100)
  const sum = raw.reduce((t, v) => t + v, 0)
  if (!(sum > 0) || !(all > 0)) return raw.map(() => 0)
  const exact = raw.map((v) => (v / sum) * all)
  const out = exact.map(Math.floor)
  let left = all - out.reduce((t, v) => t + v, 0)
  exact
    .map((v, i) => ({ i, r: v - out[i]! }))
    .sort((a, b) => b.r - a.r)
    .forEach((x) => {
      if (left > 0) {
        out[x.i]!++
        left--
      }
    })
  return out.map((c) => c / 100)
}

export const cloShare = (
  cells: Cell[],
  objectives: Objective[],
  activityId: string,
  cloId: string,
) => {
  const ids = new Set(objectives.filter((o) => o.cloId === cloId).map((o) => o.id))
  const mine = cells.filter((c) => c.activityId === activityId && ids.has(c.objectiveId))
  return mine.length ? cents(mine.reduce((t, c) => t + c.weight, 0)) : null
}

/** The cells after putting `activityId`'s share of `cloId` at `value` (null clears it). */
export function setCloShare(
  cells: Cell[],
  objectives: Objective[],
  activityId: string,
  cloId: string,
  value: number | null,
): Cell[] {
  const objs = objectives.filter((o) => o.cloId === cloId)
  const ids = new Set(objs.map((o) => o.id))
  const isMine = (c: Cell) => c.activityId === activityId && ids.has(c.objectiveId)
  const keep = cells.filter((c) => !isMine(c))
  if (value === null || !(value > 0)) return keep
  const current = cells.filter(isMine)
  // Existing split wins; a first link follows the objectives' own weights (Q7).
  const basis = current.length
    ? current.map((c) => ({ objectiveId: c.objectiveId, share: c.weight }))
    : objs.map((o) => ({ objectiveId: o.id, share: o.weight ?? 0 }))
  const usable = basis.some((b) => b.share > 0)
    ? basis
    : objs.map((o) => ({ objectiveId: o.id, share: 1 }))
  const parts = splitCents(
    usable.map((b) => b.share),
    value,
  )
  return [
    ...keep,
    ...usable.flatMap((b, i) =>
      parts[i]! > 0 ? [{ activityId, objectiveId: b.objectiveId, weight: parts[i]! }] : [],
    ),
  ]
}

/** "แบ่งเท่ากัน" on a row: the activity's 100% spread evenly over the CLOs it already touches. */
export function evenRow(cells: Cell[], objectives: Objective[], activityId: string): Cell[] {
  const touched = [
    ...new Set(
      cells
        .filter((c) => c.activityId === activityId)
        .map((c) => objectives.find((o) => o.id === c.objectiveId)?.cloId)
        .filter((x): x is string => !!x),
    ),
  ]
  if (!touched.length) return cells
  const parts = splitCents(
    touched.map(() => 1),
    100,
  )
  return touched.reduce(
    (acc, cloId, i) => setCloShare(acc, objectives, activityId, cloId, parts[i]!),
    cells,
  )
}
