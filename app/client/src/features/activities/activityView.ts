/**
 * Labels, defaults and grouping of activities (index-q.html ACT_TYPE_TH,
 * ASSESS_TH, ACT_DEFAULT_MAX, actTypeGroups). One place, so the list, the
 * matrix, the roster and the form say the same words.
 */
import type { Activity, ActivityKind, Method } from "./activity.types.ts"

export const TYPE_TH: Record<Exclude<ActivityKind, "CUSTOM">, string> = {
  LECTURE: "นำเสนอ",
  LAB: "ปฏิบัติการ (Lab)",
  TEST: "สอบ",
  PROJECT: "โครงงาน / ชิ้นงาน",
  OTHER: "อื่น ๆ",
}
export const METHOD_TH: Record<Exclude<Method, "CUSTOM">, string> = {
  QUIZ: "แบบทดสอบ (Quiz)",
  EXAM: "ข้อสอบ",
  RUBRIC: "รูบริก (Rubric)",
  WORK: "ตรวจชิ้นงาน / รายงาน",
  OBSERVATION: "สังเกตพฤติกรรม",
  OTHER: "อื่น ๆ",
}
/** The method a type is usually assessed by — the same table as the server (design #35). */
export const DEFAULT_METHOD: Record<Exclude<ActivityKind, "CUSTOM">, Method> = {
  TEST: "EXAM",
  LAB: "RUBRIC",
  LECTURE: "RUBRIC",
  PROJECT: "WORK",
  OTHER: "OTHER",
}
/** M2: the full score a new activity starts with, by type; lowerable later. */
export const DEFAULT_MAX: Record<ActivityKind, number> = {
  LECTURE: 20,
  LAB: 50,
  TEST: 100,
  PROJECT: 100,
  OTHER: 100,
  CUSTOM: 100,
}

export const typeText = (a: Pick<Activity, "type" | "typeLabel">) =>
  a.type === "CUSTOM" ? a.typeLabel || "กำหนดเอง" : TYPE_TH[a.type]
export const methodText = (a: Pick<Activity, "assessmentMethod" | "assessmentLabel">) =>
  a.assessmentMethod === "CUSTOM" ? a.assessmentLabel || "กำหนดเอง" : METHOD_TH[a.assessmentMethod]

/** The weight-group key: a type, or "CUSTOM:<name>" — each named custom type is its own group. */
export const groupKey = (a: Pick<Activity, "type" | "typeLabel">) =>
  a.type === "CUSTOM" ? `CUSTOM:${a.typeLabel}` : a.type
export const groupLabel = (k: string) =>
  k.startsWith("CUSTOM:")
    ? k.slice(7) || "กำหนดเอง"
    : (TYPE_TH[k as keyof typeof TYPE_TH] ?? "ไม่ระบุประเภท")

export type TypeGroup<T extends Pick<Activity, "type" | "typeLabel">> = {
  key: string
  label: string
  items: T[]
}

/** Groups in the order of the first activity found; inside a group the activity order stays. */
export function typeGroups<T extends Pick<Activity, "type" | "typeLabel">>(
  acts: T[],
): TypeGroup<T>[] {
  const seen = new Map<string, TypeGroup<T>>()
  for (const a of acts) {
    const k = groupKey(a)
    const g = seen.get(k) ?? { key: k, label: groupLabel(k), items: [] }
    g.items.push(a)
    seen.set(k, g)
  }
  return [...seen.values()]
}
