import { describe, expect, it } from "vitest"
import type { GradingStudent } from "./grading.types.ts"
import { freezeNote, isLoose, isStale } from "./gradingView.ts"

const student = (over: Partial<GradingStudent> = {}): GradingStudent => ({
  studentId: "s1",
  studentCode: "001",
  name: "หนึ่ง",
  status: "ENROLLED",
  totalPercent: 80,
  complete: true,
  tScore: null,
  derivedGrade: "A",
  issuedGrade: null,
  overrideReason: null,
  ...over,
})
const frozen = { frozen: true }
const live = { frozen: false }

describe("isStale", () => {
  it("is a frozen grade that today's scores no longer give, with no override", () => {
    expect(isStale(frozen, student({ issuedGrade: "B", derivedGrade: "A" }))).toBe(true)
  })

  it.each([
    ["not frozen", live, { issuedGrade: "B", derivedGrade: "A" }],
    ["same grade", frozen, { issuedGrade: "A", derivedGrade: "A" }],
    ["overridden on purpose", frozen, { issuedGrade: "B", derivedGrade: "A", overrideReason: "x" }],
    ["nothing issued", frozen, { issuedGrade: null, derivedGrade: "A" }],
    ["no derived grade", frozen, { issuedGrade: "B", derivedGrade: null }],
  ])("is not stale when %s", (_n, g, over) => {
    expect(isStale(g, student(over))).toBe(false)
  })

  it("is false, not undefined, before the grading has loaded", () => {
    expect(isStale(undefined, student({ issuedGrade: "B" }))).toBe(false)
  })
})

describe("isLoose", () => {
  it("is a complete grade that a frozen course never issued", () => {
    expect(isLoose(frozen, student())).toBe(true)
    expect(isLoose(frozen, student({ issuedGrade: "A" }))).toBe(false)
    expect(isLoose(frozen, student({ derivedGrade: null }))).toBe(false)
    expect(isLoose(live, student())).toBe(false)
  })
})

describe("freezeNote", () => {
  it("says nothing before the grading loads", () => {
    expect(freezeNote(undefined, [student()])).toBeNull()
  })

  it("not frozen: an info line only when someone already has a live grade", () => {
    expect(freezeNote(live, [student()])?.[0]).toBe("info")
    expect(freezeNote(live, [student({ derivedGrade: null })])).toBeNull()
  })

  it("counts only enrolled students, so a withdrawn W is ignored", () => {
    expect(freezeNote(live, [student({ status: "WITHDRAWN", derivedGrade: "W" })])).toBeNull()
  })

  it("frozen and in step: ok, with how many grades were issued", () => {
    const note = freezeNote(frozen, [
      student({ issuedGrade: "A" }),
      student({ studentId: "s2", issuedGrade: "A" }),
    ])
    expect(note).toEqual(["ok", "ตรึงเกรดแล้ว 2 คน — ตรงกับคะแนนปัจจุบันทุกคน"])
  })

  it("frozen with stale and loose students: warn, naming each count", () => {
    const note = freezeNote(frozen, [
      student({ issuedGrade: "B", derivedGrade: "A" }),
      student({ studentId: "s2" }),
    ])
    expect(note?.[0]).toBe("warn")
    expect(note?.[1]).toContain("มี 1 คน")
    expect(note?.[1]).toContain("คะแนนเปลี่ยนหลังตรึงเกรด")
    expect(note?.[1]).toContain("ครบแล้วแต่ยังไม่ถูกตรึง")
    expect(note?.[1]).toMatch(/ · กด “ประมวลผลเกรด” เพื่อคำนวณและตรึงใหม่$/)
  })

  it("only one of the two clauses appears when only one applies", () => {
    const stale = freezeNote(frozen, [student({ issuedGrade: "B", derivedGrade: "A" })])
    expect(stale?.[1]).not.toContain("ยังไม่ถูกตรึง")
    const loose = freezeNote(frozen, [student()])
    expect(loose?.[1]).not.toContain("เปลี่ยนหลังตรึงเกรด")
  })
})
