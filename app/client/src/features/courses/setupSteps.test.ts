import { describe, expect, it } from "vitest"
import type { Activity, Criteria, CriteriaMeta } from "../activities/activity.types.ts"
import type { Clo } from "../clos/clo.types.ts"
import { evenShares } from "../clos/useClos.ts"
import { stepStates } from "./setupSteps.ts"

const clo = (
  id: string,
  number: number,
  weight: number | null,
  computedWeight = weight ?? 0,
): Clo => ({
  id,
  number,
  description: "",
  weight,
  levelSource: "AUTO",
  bloomLevel: "APPLY",
  soloLevel: "DEEP",
  computedWeight,
  objectiveCount: 0,
  isMeasured: false,
})
const act = (id: string, weight: number, scoredCount = 0, studentCount = 0): Activity => ({
  id,
  name: id,
  type: "TEST",
  weight,
  maxScore: 10,
  order: 1,
  scoredCount,
  studentCount,
})
const criteria = (c: Partial<Criteria>, m: Partial<CriteriaMeta>) => ({
  objectives: [],
  activities: [],
  cells: [],
  ...c,
  meta: {
    activityWeightSums: {},
    cloWeights: {},
    unlinkedActivityIds: [],
    unmeasuredObjectiveIds: [],
    objectiveWeightSums: {},
    totalWeight: 0,
    isReadyForDashboard: false,
    ...m,
  },
})

describe("setup steps (index-q readiness)", () => {
  it("blocks everything on an empty course", () => {
    const s = stepStates({ clos: [], criteria: criteria({}, {}), activities: [], students: 0 })
    expect(Object.values(s).map((x) => x.state)).toEqual([
      "block",
      "block",
      "block",
      "block",
      "block",
    ])
  })

  it("only warns when planned CLO weights do not sum to 100 (E2)", () => {
    const s = stepStates({
      clos: [clo("a", 1, 40), clo("b", 2, 50)],
      criteria: criteria({}, {}),
      activities: [],
      students: 0,
    })
    expect(s.clo.state).toBe("warn")
    expect(s.clo.detail).toContain("90%")
  })

  it("blocks objectives that do not sum to 100, warns for a CLO with none", () => {
    const objectives = [{ id: "o1", cloId: "a", label: "1.1", weight: 60 }]
    const bad = stepStates({
      clos: [clo("a", 1, 100)],
      criteria: criteria({ objectives }, { objectiveWeightSums: { a: 60 } }),
      activities: [],
      students: 0,
    })
    expect(bad.obj.state).toBe("block")
    const missing = stepStates({
      clos: [clo("a", 1, 50), clo("b", 2, 50)],
      criteria: criteria({ objectives }, { objectiveWeightSums: { a: 100 } }),
      activities: [],
      students: 0,
    })
    expect(missing.obj).toMatchObject({ state: "warn" })
    expect(missing.obj.detail).toContain("CLO 2")
  })

  it("blocks activities not summing to 100 (Q3), and counts filled score cells", () => {
    const acts = [act("x", 60, 3, 3), act("y", 40, 1, 3)]
    const s = stepStates({
      clos: [clo("a", 1, 100)],
      criteria: criteria(
        { activities: acts.map((a) => ({ id: a.id, name: a.name, weight: a.weight })) },
        { totalWeight: 100, activityWeightSums: { x: 100, y: 100 } },
      ),
      activities: acts,
      students: 3,
    })
    expect(s.act.state).toBe("ok")
    expect(s.roster).toMatchObject({ state: "doing", detail: "3 คน · กรอกคะแนนแล้ว 4 / 6 ช่อง" })
  })
})

describe("evenShares", () => {
  it("splits 100 to two decimals, the last share taking the remainder", () => {
    expect(evenShares(3)).toEqual([33.33, 33.33, 33.34])
    expect(evenShares(4)).toEqual([25, 25, 25, 25])
    expect(evenShares(0)).toEqual([])
  })
})
