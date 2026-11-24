import { describe, expect, it } from "vitest"
import {
  linksUnchanged,
  NEW,
  parseChoice,
  validateActivity,
  type ActivityContext,
  type ActivityDraft,
} from "./activityValidation.ts"

const draft = (over: Partial<ActivityDraft> = {}): ActivityDraft => ({
  name: "Quiz 1",
  type: "TEST",
  typeLabel: "",
  method: "EXAM",
  methodLabel: "",
  weight: "20",
  maxScore: "10",
  passScore: "",
  ticked: { o1: "100" },
  ...over,
})
const ctx = (over: Partial<ActivityContext> = {}): ActivityContext => ({
  byGroup: false,
  others: 50,
  left: 50,
  hasObjectives: true,
  ...over,
})

describe("parseChoice", () => {
  it("reads a built-in key, a course's own custom name, and a new one", () => {
    expect(parseChoice("LAB", "")).toEqual({ key: "LAB", label: "" })
    expect(parseChoice("CUSTOM:กรณีศึกษา", "")).toEqual({ key: "CUSTOM", label: "กรณีศึกษา" })
    expect(parseChoice(NEW, "  ใหม่ ")).toEqual({ key: "CUSTOM", label: "ใหม่" })
  })
})

describe("validateActivity", () => {
  it("a good draft has no errors", () => {
    expect(validateActivity(draft(), ctx())).toEqual({})
  })

  it("needs a name, and a name for a new type or method", () => {
    expect(validateActivity(draft({ name: "  ", type: NEW, method: NEW }), ctx())).toMatchObject({
      name: "กรอกชื่อกิจกรรมก่อน",
      typeLabel: "พิมพ์ชื่อประเภทใหม่",
      assessmentLabel: "พิมพ์ชื่อวิธีประเมินใหม่",
    })
    expect(
      validateActivity(draft({ type: NEW, typeLabel: "กรณีศึกษา" }), ctx()).typeLabel,
    ).toBeUndefined()
  })

  it.each(["", "  ", "0", "-3", "abc"])("refuses a full score of %j", (maxScore) => {
    expect(validateActivity(draft({ maxScore }), ctx()).maxScore).toBe("คะแนนเต็มต้องมากกว่า 0")
  })

  it("pass score: optional, not negative, not above the full score", () => {
    expect(validateActivity(draft({ passScore: "" }), ctx()).passScore).toBeUndefined()
    expect(validateActivity(draft({ passScore: "0" }), ctx()).passScore).toBeUndefined()
    expect(validateActivity(draft({ passScore: "-1" }), ctx()).passScore).toMatch("ไม่ติดลบ")
    expect(validateActivity(draft({ passScore: "x" }), ctx()).passScore).toMatch("ไม่ติดลบ")
    expect(validateActivity(draft({ passScore: "11" }), ctx()).passScore).toMatch(
      "มากกว่าคะแนนเต็ม",
    )
  })

  it("does not compare a pass score with a full score that is itself wrong", () => {
    const e = validateActivity(draft({ maxScore: "0", passScore: "5" }), ctx())
    expect(e.maxScore).toBeDefined()
    expect(e.passScore).toBeUndefined()
  })

  it("weight: required, 0–100, and within what the other activities leave", () => {
    expect(validateActivity(draft({ weight: "" }), ctx()).weight).toMatch("เหลือ 50%")
    expect(validateActivity(draft({ weight: "0" }), ctx()).weight).toBeUndefined()
    expect(validateActivity(draft({ weight: "50" }), ctx()).weight).toBeUndefined()
    expect(validateActivity(draft({ weight: "50.5" }), ctx()).weight).toBe(
      "กิจกรรมอื่นรวม 50% แล้ว — ใส่ได้ไม่เกิน 50%",
    )
    expect(validateActivity(draft({ weight: "101" }), ctx({ others: 0, left: 100 })).weight).toBe(
      "ร้อยละของสัดส่วนคะแนนต้องอยู่ระหว่าง 0–100",
    )
    expect(validateActivity(draft({ weight: "-1" }), ctx()).weight).toMatch("0–100")
  })

  it("in GROUP mode the weight is not checked at all", () => {
    expect(validateActivity(draft({ weight: "" }), ctx({ byGroup: true })).weight).toBeUndefined()
  })

  it("links: at least one objective, each share in (0, 100], adding up to 100", () => {
    expect(validateActivity(draft({ ticked: {} }), ctx()).links).toMatch("อย่างน้อย 1 ข้อ")
    expect(validateActivity(draft({ ticked: { o1: "0", o2: "100" } }), ctx()).links).toMatch(
      "มากกว่า 0",
    )
    expect(validateActivity(draft({ ticked: { o1: "abc" } }), ctx()).links).toMatch("มากกว่า 0")
    expect(validateActivity(draft({ ticked: { o1: "101" } }), ctx()).links).toMatch("ไม่เกิน 100")
    expect(validateActivity(draft({ ticked: { o1: "30", o2: "60" } }), ctx()).links).toBe(
      "สัดส่วนของจุดประสงค์ต้องรวมได้ 100% (ตอนนี้ 90%)",
    )
    expect(
      validateActivity(draft({ ticked: { o1: "33.33", o2: "66.67" } }), ctx()).links,
    ).toBeUndefined()
  })

  it("a course with no objectives needs no links", () => {
    expect(
      validateActivity(draft({ ticked: {} }), ctx({ hasObjectives: false })).links,
    ).toBeUndefined()
  })
})

describe("linksUnchanged", () => {
  const mine = [
    { objectiveId: "o1", weight: 60 },
    { objectiveId: "o2", weight: 40 },
  ]
  it("is true for the same set and shares, in any order, within rounding", () => {
    expect(
      linksUnchanged(mine, [
        ["o2", 40],
        ["o1", 60.004],
      ]),
    ).toBe(true)
  })
  it("is false when a share, an objective or the count differs", () => {
    expect(
      linksUnchanged(mine, [
        ["o1", 50],
        ["o2", 50],
      ]),
    ).toBe(false)
    expect(
      linksUnchanged(mine, [
        ["o1", 60],
        ["o3", 40],
      ]),
    ).toBe(false)
    expect(linksUnchanged(mine, [["o1", 100]])).toBe(false)
  })
})
