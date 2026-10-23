import { describe, expect, it } from "vitest"
import type { GridActivity, GridStudent } from "./score.types.ts"
import {
  blanksOf,
  cellText,
  parseCell,
  parsePaste,
  planFill,
  planPaste,
  undoOf,
} from "./gridMath.ts"

const act = (id: string, maxScore: number, closedAt: string | null = null): GridActivity => ({
  id,
  name: id,
  maxScore,
  passScore: maxScore / 2,
  closedAt,
})
const stu = (
  id: string,
  scores: GridStudent["scores"],
  status: GridStudent["status"] = "ENROLLED",
): GridStudent => ({
  id,
  studentCode: `code-${id}`,
  name: id,
  status,
  scores,
})

describe("parseCell", () => {
  it("clears on empty, excuses on the word, takes a number up to the full score", () => {
    expect(parseCell("", 20)).toEqual({ ok: true, value: null })
    expect(parseCell(" ยกเว้น ", 20)).toEqual({ ok: true, value: "EXCUSED" })
    expect(parseCell("X", 20)).toEqual({ ok: true, value: "EXCUSED" })
    expect(parseCell("0", 20)).toEqual({ ok: true, value: 0 }) // a real zero, not a blank
    expect(parseCell("17.456", 20)).toEqual({ ok: true, value: 17.46 })
  })
  it("refuses text, negatives and more than the full score", () => {
    expect(parseCell("abc", 20).ok).toBe(false)
    expect(parseCell("-1", 20).ok).toBe(false)
    expect(parseCell("21", 20)).toEqual({ ok: false, reason: "คะแนนเกินคะแนนเต็ม 20" })
  })
})

describe("cellText", () => {
  it("shows a blank as nothing and 0 as 0", () => {
    expect(cellText(null)).toBe("")
    expect(cellText(undefined)).toBe("")
    expect(cellText(0)).toBe("0")
    expect(cellText("EXCUSED")).toBe("ยกเว้น")
  })
})

describe("planPaste", () => {
  const students = [stu("s1", { a: 5 }), stu("s2", {}), stu("s3", {}, "WITHDRAWN")]
  const activities = [act("a", 10), act("b", 10, "2025-08-01")]

  it("parses Excel text and drops the trailing empty line", () => {
    expect(parsePaste("1\t2\r\n3\t4\r\n")).toEqual([
      ["1", "2"],
      ["3", "4"],
    ])
  })

  it("writes only changed cells, with what the screen saw as `from`", () => {
    const plan = planPaste(students, activities, 0, 0, [["5"], ["7"]])
    expect(plan.writes).toEqual([{ studentId: "s2", activityId: "a", score: 7, from: null }])
  })

  it("skips a withdrawn student and a closed activity, and never overwrites with an empty cell", () => {
    const plan = planPaste(students, activities, 0, 0, [["", "9"], ["8", ""], ["6"]])
    expect(plan.writes).toEqual([{ studentId: "s2", activityId: "a", score: 8, from: null }])
    expect(plan.skipped).toBe(2) // s1/b is closed, s3 is withdrawn
  })

  it("reports a bad value", () => {
    const plan = planPaste(students, activities, 1, 0, [["99"]])
    expect(plan.writes).toEqual([])
    expect(plan.problems).toEqual(["code-s2 · a: คะแนนเกินคะแนนเต็ม 10"])
  })
})

describe("fill and undo", () => {
  it("fills only the blank enrolled cells with the full score", () => {
    const students = [
      stu("s1", { a: 0 }),
      stu("s2", {}),
      stu("s3", {}, "WITHDRAWN"),
      stu("s4", { a: "EXCUSED" }),
    ]
    expect(planFill(students, act("a", 10))).toEqual([
      { studentId: "s2", activityId: "a", score: 10, from: null },
    ])
    expect(planFill(students, act("a", 10, "2025-08-01"))).toEqual([])
  })

  it("undo returns each cell to what it was, expecting what was written", () => {
    expect(undoOf([{ studentId: "s", activityId: "a", score: 10, from: null }])).toEqual([
      { studentId: "s", activityId: "a", score: null, from: 10 },
    ])
  })

  it("counts blanks per student", () => {
    expect(blanksOf(stu("s", { a: 1, b: null }), [act("a", 1), act("b", 1), act("c", 1)])).toBe(2)
  })
})
