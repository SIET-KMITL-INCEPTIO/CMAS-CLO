import { round } from "../../lib/attainment.js"

/** A number rounded for display, or null when there is nothing to show. */
export const r2 = (n: number | null) => (n === null ? null : round(n))

/** The status wording used on screen and in every Excel export. */
export const STATUS_TH = {
  PASS: "ผ่าน",
  AT_RISK: "ยังไม่ผ่าน",
  NOT_EVALUATED: "ยังประเมินไม่ครบ",
} as const
