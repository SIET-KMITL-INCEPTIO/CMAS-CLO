/**
 * refactor-plan.md P4: the few domain rules the client keeps a copy of, fed the same
 * inputs as the server's original. A rule changed on one side only fails here.
 * The server files imported below have no imports of their own, so they load as is.
 */
import { describe, expect, it } from "vitest"
import * as gradeLadder from "../../../server/src/lib/grade-ladder.ts"
import * as studyPlan from "../../../server/src/lib/study-plan.ts"
import * as weights from "../../../server/src/lib/weights.ts"
import type { ActivityKind } from "../features/activities/activity.types.ts"
import { groupKey, TYPE_TH } from "../features/activities/activityView.ts"
import { termTh } from "../features/courses/courseView.ts"
import { near } from "../features/courses/setupSteps.ts"
import type { GradeMethod, GradeScale } from "../features/grading/grading.types.ts"
import { defaultBands } from "../features/grading/ladder.ts"

/** Compile-time: the two sides name the same set of values. */
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
const sameScale: Same<GradeScale, gradeLadder.GradeScale> = true
const sameMethod: Same<GradeMethod, gradeLadder.GradingMethod> = true

const SCALES: GradeScale[] = ["LETTER", "PASS_FAIL"]
const METHODS: GradeMethod[] = ["CRITERION_REFERENCED", "NORM_REFERENCED"]

describe("client ↔ server domain rules", () => {
  it("the grade scale and method types match", () => {
    expect([sameScale, sameMethod]).toEqual([true, true])
  })

  it.each(SCALES.flatMap((s) => METHODS.flatMap((m) => [0, 50, 62.5].map((p) => [s, m, p]))))(
    "defaultBands(%s, %s, %s) is the same ladder",
    (scale, method, pass) => {
      const args = [scale as GradeScale, method as GradeMethod, pass as number] as const
      expect(defaultBands(...args)).toEqual(gradeLadder.defaultBands(...args))
    },
  )

  it("groupKey gives every activity type the same weight group", () => {
    const types = [...Object.keys(TYPE_TH), "CUSTOM"] as ActivityKind[]
    for (const type of types)
      for (const typeLabel of ["", "Lab", "แล็บ 1"])
        expect(groupKey({ type, typeLabel })).toBe(weights.groupKey({ type, typeLabel }))
  })

  it("near draws the line for 'equal weights' in the same place", () => {
    const pairs = [
      [100, 100],
      [100, 99.995],
      [100, 99.99],
      [100, 99.989],
      [33.33, 33.34],
      [0, 0.0099],
      [0, -0.01],
    ]
    for (const [a, b] of pairs) expect(near(a!, b!), `${a} vs ${b}`).toBe(weights.near(a!, b!))
  })

  it("termTh names every term the same", () => {
    for (const s of [1, 2, 3]) expect(termTh(s)).toBe(studyPlan.termTh(s))
  })
})
