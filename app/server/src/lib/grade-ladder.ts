/**
 * The grade ladder a course starts with, and the pass mark it implies.
 * Same values as index-q.html (setGradeScale / the seed courses), so a course
 * created through the API grades exactly like one made in the prototype.
 *
 * Used by modules/courses (a new course gets a ladder in the same transaction)
 * and modules/grading (PUT /grade-bands validates against the same rules).
 */
export type GradeScale = "LETTER" | "PASS_FAIL"
export type GradingMethod = "CRITERION_REFERENCED" | "NORM_REFERENCED"
export type Band = { grade: string; minValue: number }

/** A–F อิงเกณฑ์ — percent of the course total. */
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

/** A–F อิงกลุ่ม — the same column read as a T-score. */
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

export const LETTER_GRADES = LETTER_PERCENT.map((b) => b.grade)
export const FAILING_GRADES = new Set(["F", "U"])

export function defaultBands(
  scale: GradeScale,
  method: GradingMethod,
  passCriteria: number,
): Band[] {
  // CR-06: for S/U the S band IS the pass mark — one number, not two that drift.
  if (scale === "PASS_FAIL") {
    return [
      { grade: "S", minValue: passCriteria },
      { grade: "U", minValue: 0 },
    ]
  }
  return (method === "NORM_REFERENCED" ? LETTER_T_SCORE : LETTER_PERCENT).map((b) => ({ ...b }))
}

/**
 * A–F อิงเกณฑ์: passing the course means reaching the lowest passing band (D = 50),
 * so passCriteria is derived from the ladder and never entered (design #16).
 */
export function lowestPassingMin(bands: Band[]): number {
  const passing = bands.filter((b) => !FAILING_GRADES.has(b.grade)).map((b) => b.minValue)
  return passing.length ? Math.min(...passing) : 0
}

/** passCriteria is entered only where the ladder cannot imply it. */
export const takesPassCriteria = (scale: GradeScale, method: GradingMethod) =>
  scale === "PASS_FAIL" || method === "NORM_REFERENCED"
