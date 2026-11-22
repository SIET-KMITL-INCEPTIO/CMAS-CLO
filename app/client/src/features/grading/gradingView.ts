/**
 * What the grading page says about frozen grades, computed from the server's
 * numbers and nothing else (grading has one calculation, FR-88).
 */
import type { Tone } from "../../components/ui/tone.ts"
import type { Grading, GradingStudent } from "./grading.types.ts"

/** Frozen, but today's scores give another grade and nobody overrode it: the issued grade is stale. */
export const isStale = (g: Pick<Grading, "frozen"> | undefined, s: GradingStudent): boolean =>
  Boolean(
    g?.frozen &&
    s.issuedGrade !== null &&
    !s.overrideReason &&
    s.derivedGrade !== null &&
    s.derivedGrade !== s.issuedGrade,
  )

/** Complete scores, frozen course, but this student's grade was never issued. */
export const isLoose = (g: Pick<Grading, "frozen"> | undefined, s: GradingStudent): boolean =>
  Boolean(g?.frozen && s.issuedGrade === null && s.derivedGrade !== null)

/** The one-line banner under the page header, with its tone; null when there is nothing to say. */
export function freezeNote(
  g: Pick<Grading, "frozen"> | undefined,
  students: GradingStudent[],
): [Tone, string] | null {
  if (!g) return null
  const enrolled = students.filter((s) => s.status === "ENROLLED")
  if (!g.frozen)
    return enrolled.some((s) => s.derivedGrade !== null)
      ? ["info", "ยังไม่ได้ประมวลผลเกรด — เกรดในตารางยังเปลี่ยนตามคะแนน"]
      : null
  const loose = enrolled.filter((s) => isLoose(g, s)).length
  const nStale = enrolled.filter((s) => isStale(g, s)).length
  if (nStale || loose)
    return [
      "warn",
      [
        nStale ? `มี ${nStale} คนที่คะแนนเปลี่ยนหลังตรึงเกรด — เกรดที่ออกยังเป็นค่าที่ตรึงไว้` : "",
        loose ? `มี ${loose} คนที่คะแนนครบแล้วแต่ยังไม่ถูกตรึง` : "",
      ]
        .filter(Boolean)
        .join(" · ") + " · กด “ประมวลผลเกรด” เพื่อคำนวณและตรึงใหม่",
    ]
  return [
    "ok",
    `ตรึงเกรดแล้ว ${students.filter((s) => s.issuedGrade).length} คน — ตรงกับคะแนนปัจจุบันทุกคน`,
  ]
}
