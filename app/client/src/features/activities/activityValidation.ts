/**
 * The activity form's rules, apart from the form: what each field may hold, and the
 * messages the server's 422 would otherwise be the first to say (FR-43, FR-45, T4).
 * Pure: the same draft always gives the same errors.
 */
import { n2 } from "../clos/useClos.ts"

/** The server's limit on a custom type or method name (activities.validator.ts). */
export const LABEL_MAX = 100

/** The key a name the instructor typed is held under: "CUSTOM:<name>". */
export const customKey = (name: string) => `CUSTOM:${name}`

export type ActivityErrors = Partial<
  Record<"name" | "weight" | "maxScore" | "passScore" | "links", string>
>

/** A choice is a built-in key, or "CUSTOM:<name>" for a name the instructor typed or the course already has. */
export const parseChoice = <K extends string>(v: string): { key: K; label: string } =>
  v.startsWith("CUSTOM:")
    ? { key: "CUSTOM" as K, label: v.slice(7).trim() }
    : { key: v as K, label: "" }

/** What the user has typed, as the form holds it: strings, not yet numbers. */
export type ActivityDraft = {
  name: string
  weight: string
  maxScore: string
  passScore: string
  /** objectiveId → its share of this activity, typed. */
  ticked: Record<string, string>
}

export type ActivityContext = {
  /** GROUP mode: no weight box, the group decides. */
  byGroup: boolean
  /** The other activities' weights added up. */
  others: number
  /** 100 − others, never below 0. */
  left: number
  /** The course has objectives to link to. */
  hasObjectives: boolean
}

export function validateActivity(d: ActivityDraft, ctx: ActivityContext): ActivityErrors {
  const { byGroup, others, left, hasObjectives } = ctx
  const e: ActivityErrors = {}
  const max = Number(d.maxScore)
  const w = Number(d.weight)
  if (!d.name.trim()) e.name = "กรอกชื่อกิจกรรมก่อน"
  if (d.maxScore.trim() === "" || !Number.isFinite(max) || max <= 0)
    e.maxScore = "คะแนนเต็มต้องมากกว่า 0"
  if (d.passScore.trim() !== "") {
    const p = Number(d.passScore)
    if (!Number.isFinite(p) || p < 0) e.passScore = "คะแนนที่ถือว่าผ่านต้องเป็นตัวเลขไม่ติดลบ"
    else if (!e.maxScore && p > max) e.passScore = "คะแนนที่ถือว่าผ่านมากกว่าคะแนนเต็มไม่ได้"
  }
  if (!byGroup) {
    if (d.weight.trim() === "")
      e.weight = `กรอกร้อยละของสัดส่วนคะแนนในวิชา (เหลือ ${n2(left)}% · ใส่ 0 ได้ถ้ายังไม่เข้าการคำนวณ)`
    else if (!Number.isFinite(w) || w < 0 || w > 100)
      e.weight = "ร้อยละของสัดส่วนคะแนนต้องอยู่ระหว่าง 0–100"
    else if (others + w > 100 + 1e-9)
      e.weight = `กิจกรรมอื่นรวม ${n2(others)}% แล้ว — ใส่ได้ไม่เกิน ${n2(left)}%`
  }
  const links = Object.entries(d.ticked).map(([id, v]) => [id, Number(v)] as const)
  if (hasObjectives) {
    if (links.length === 0)
      e.links = "เลือกจุดประสงค์ที่กิจกรรมนี้วัดอย่างน้อย 1 ข้อ — ทุกกิจกรรมต้องเชื่อมกับ CLO"
    else if (links.some(([, v]) => !Number.isFinite(v) || v <= 0 || v > 100))
      e.links = "สัดส่วนของแต่ละจุดประสงค์ต้องเป็นตัวเลขมากกว่า 0 และไม่เกิน 100"
    else {
      const sum = links.reduce((s, [, v]) => s + v, 0)
      if (Math.abs(sum - 100) >= 0.01)
        e.links = `สัดส่วนของจุดประสงค์ต้องรวมได้ 100% (ตอนนี้ ${n2(sum)}%)`
    }
  }
  return e
}

/** Links are sent only when they changed: saving them costs a read and a replace of the whole matrix. */
export const linksUnchanged = (
  mine: { objectiveId: string; weight: number }[],
  links: (readonly [string, number])[],
) =>
  mine.length === links.length &&
  links.every(([id, v]) => mine.some((c) => c.objectiveId === id && Math.abs(c.weight - v) < 0.005))
