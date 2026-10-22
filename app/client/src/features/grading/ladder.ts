/**
 * The grade ladder a course starts with — the same values as the server's
 * grade-ladder.ts and index-q.html, so a ladder reset from the screen is the
 * one a new course gets. Changing the scale or method starts from these.
 */
import type { Band, GradeMethod, GradeScale } from "./grading.types.ts"

const LETTER_PERCENT: Band[] = [
  { grade: "A", minValue: 80 },
  { grade: "B+", minValue: 75 },
  { grade: "B", minValue: 70 },
  { grade: "C+", minValue: 65 },
  { grade: "C", minValue: 60 },
  { grade: "D+", minValue: 55 },
  { grade: "D", minValue: 50 },
  { grade: "F", minValue: 0 },
]
const LETTER_T_SCORE: Band[] = [
  { grade: "A", minValue: 65 },
  { grade: "B+", minValue: 60 },
  { grade: "B", minValue: 55 },
  { grade: "C+", minValue: 50 },
  { grade: "C", minValue: 45 },
  { grade: "D+", minValue: 40 },
  { grade: "D", minValue: 35 },
  { grade: "F", minValue: 0 },
]

export function defaultBands(scale: GradeScale, method: GradeMethod, passCriteria: number): Band[] {
  // For S/U the S band IS the pass mark (CR-06).
  if (scale === "PASS_FAIL")
    return [
      { grade: "S", minValue: passCriteria },
      { grade: "U", minValue: 0 },
    ]
  return (method === "NORM_REFERENCED" ? LETTER_T_SCORE : LETTER_PERCENT).map((b) => ({ ...b }))
}

/** What the grading page says about a ladder and what typing it checks (the server checks again). */
export function checkBands(bands: Band[], method: GradeMethod): string | null {
  if (new Set(bands.map((b) => b.grade)).size !== bands.length) return "ชื่อเกรดซ้ำกัน"
  if (new Set(bands.map((b) => b.minValue)).size !== bands.length) return "คะแนนเริ่มของเกรดซ้ำกัน"
  if (!bands.some((b) => b.minValue === 0)) return "ต้องมีเกรดที่เริ่มที่ 0"
  if (method === "CRITERION_REFERENCED" && bands.some((b) => b.minValue > 100))
    return "ขั้นอิงเกณฑ์เป็นร้อยละ — คะแนนเริ่มต้องไม่เกิน 100"
  return null
}

/** The ladder after one band is added (`old` null), edited, or removed (`next` null). */
export function withBand(bands: Band[], old: string | null, next: Band | null): Band[] {
  const rest = bands.filter((b) => b.grade !== old)
  return (next ? [...rest, next] : rest).sort((a, b) => b.minValue - a.minValue)
}

/** "80.00 – 100.00": the upper edge sits a hundredth below the next band, so no number is in two bands (H4). */
export function rangeText(
  b: { minValue: number; maxValue: number | null },
  i: number,
  norm: boolean,
) {
  const f = (v: number) => v.toFixed(2)
  if (i === 0)
    return norm || b.maxValue === null
      ? `ตั้งแต่ ${f(b.minValue)}`
      : `${f(b.minValue)} – ${f(b.maxValue)}`
  return `${f(b.minValue)} – ${f(Math.max(b.minValue, (b.maxValue ?? b.minValue) - 0.01))}`
}
