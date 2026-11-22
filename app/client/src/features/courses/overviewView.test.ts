import { describe, expect, it } from "vitest"
import type { AtRiskRow, Attainment, CloAttainment } from "../dashboard/dashboard.types.ts"
import { attainmentState, LEVEL, why } from "./overviewView.ts"

const row = (over: Partial<AtRiskRow> = {}): AtRiskRow => ({
  studentId: "s1",
  studentCode: "001",
  name: "หนึ่ง",
  level: "CLO_BELOW",
  failedClos: [],
  overdue: [],
  totalScore: 40,
  coursePassed: null,
  ...over,
})
const failed = (over: Partial<AtRiskRow["failedClos"][number]> = {}) => ({
  cloId: "c1",
  number: 1,
  score: 40,
  gap: 20,
  near: false,
  provisional: false,
  hasPlan: false,
  ...over,
})

describe("why", () => {
  it("names each failed CLO with its gap, and marks a provisional one with *", () => {
    expect(
      why(row({ failedClos: [failed(), failed({ number: 2, gap: 7.5, provisional: true })] }), 50),
    ).toBe("ต่ำกว่าเกณฑ์ CLO 1 (−20), CLO 2* (−7.5)")
  })

  it("a course fail with no failed CLO says the total is under the pass mark", () => {
    expect(why(row({ level: "COURSE_FAIL" }), 50)).toBe("คะแนนรวมต่ำกว่าเกณฑ์ผ่าน 50%")
  })

  it("a failed CLO wins over the total, and overdue work is added after it", () => {
    expect(
      why(
        row({
          level: "COURSE_FAIL",
          failedClos: [failed()],
          overdue: [
            { activityId: "a1", name: "Quiz 1" },
            { activityId: "a2", name: "Lab" },
          ],
        }),
        50,
      ),
    ).toBe("ต่ำกว่าเกณฑ์ CLO 1 (−20) · ขาดส่ง Quiz 1, Lab")
  })

  it("an overdue-only row has just the overdue part", () => {
    expect(
      why(row({ level: "OVERDUE", overdue: [{ activityId: "a1", name: "Quiz 1" }] }), 50),
    ).toBe("ขาดส่ง Quiz 1")
  })

  it("a missing gap counts as 0", () => {
    expect(why(row({ failedClos: [failed({ gap: null })] }), 50)).toBe("ต่ำกว่าเกณฑ์ CLO 1 (−0)")
  })
})

describe("LEVEL", () => {
  it("course fail is the only bad tone", () => {
    expect(Object.fromEntries(Object.entries(LEVEL).map(([k, v]) => [k, v[1]]))).toEqual({
      COURSE_FAIL: "bad",
      CLO_BELOW: "warn",
      OVERDUE: "warn",
    })
  })
})

describe("attainmentState", () => {
  const clo = (attainment: number | null) => ({ attainment }) as CloAttainment
  const a = (computable: boolean, clos: CloAttainment[]): Attainment => ({
    classTarget: 60,
    cloPassMark: 60,
    helpCount: 0,
    clos,
    meta: { computable, blockers: [], teachingSignals: [] },
  })

  it("before the data loads it is not locked, and there are no scores", () => {
    expect(attainmentState(undefined)).toEqual({ locked: false, noScores: true })
  })

  it("is locked when the server cannot compute it", () => {
    expect(attainmentState(a(false, [clo(50)])).locked).toBe(true)
    expect(attainmentState(a(true, [clo(50)])).locked).toBe(false)
  })

  it("has no scores only when every CLO is empty (a course with no CLO counts as none)", () => {
    expect(attainmentState(a(true, [clo(null), clo(null)])).noScores).toBe(true)
    expect(attainmentState(a(true, [clo(null), clo(0)])).noScores).toBe(false)
    expect(attainmentState(a(true, [])).noScores).toBe(true)
  })
})
