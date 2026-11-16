import { describe, expect, it } from "vitest"
import type { Activity } from "./activity.types.ts"
import {
  DEFAULT_MAX,
  DEFAULT_METHOD,
  groupKey,
  groupLabel,
  methodText,
  typeGroups,
  typeText,
} from "./activityView.ts"

describe("activityView", () => {
  it("names a built-in type and a custom one", () => {
    expect(typeText({ type: "LAB", typeLabel: "" })).toBe("ปฏิบัติการ (Lab)")
    expect(typeText({ type: "CUSTOM", typeLabel: "สัมมนา" })).toBe("สัมมนา")
    expect(typeText({ type: "CUSTOM", typeLabel: "" })).toBe("กำหนดเอง")
  })

  it("names a built-in method and a custom one", () => {
    expect(methodText({ assessmentMethod: "QUIZ", assessmentLabel: "" })).toBe("แบบทดสอบ (Quiz)")
    expect(methodText({ assessmentMethod: "CUSTOM", assessmentLabel: "สัมภาษณ์" })).toBe("สัมภาษณ์")
    expect(methodText({ assessmentMethod: "CUSTOM", assessmentLabel: "" })).toBe("กำหนดเอง")
  })

  it("gives each named custom type its own weight group", () => {
    expect(groupKey({ type: "TEST", typeLabel: "" })).toBe("TEST")
    expect(groupKey({ type: "CUSTOM", typeLabel: "สัมมนา" })).toBe("CUSTOM:สัมมนา")
    expect(groupLabel("TEST")).toBe("สอบ")
    expect(groupLabel("CUSTOM:สัมมนา")).toBe("สัมมนา")
    expect(groupLabel("CUSTOM:")).toBe("กำหนดเอง")
    expect(groupLabel("NOPE")).toBe("ไม่ระบุประเภท")
  })

  it("groups in first-seen order and keeps the order inside a group", () => {
    const acts = [
      { id: "a", type: "LAB", typeLabel: "" },
      { id: "b", type: "TEST", typeLabel: "" },
      { id: "c", type: "LAB", typeLabel: "" },
      { id: "d", type: "CUSTOM", typeLabel: "สัมมนา" },
    ] satisfies (Pick<Activity, "type" | "typeLabel"> & { id: string })[]
    const groups = typeGroups(acts)
    expect(groups.map((g) => g.key)).toEqual(["LAB", "TEST", "CUSTOM:สัมมนา"])
    expect(groups[0]!.items.map((a) => a.id)).toEqual(["a", "c"])
    expect(groups[2]!.label).toBe("สัมมนา")
    expect(typeGroups([])).toEqual([])
  })

  it("defaults match the server's table (design #35, M2)", () => {
    expect(DEFAULT_METHOD.TEST).toBe("EXAM")
    expect(DEFAULT_METHOD.PROJECT).toBe("WORK")
    expect(DEFAULT_MAX.LECTURE).toBe(20)
    expect(DEFAULT_MAX.LAB).toBe(50)
  })
})
