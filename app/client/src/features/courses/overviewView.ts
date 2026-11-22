/** What the course overview says about the follow-up list and the CLO result, from the server's numbers. */
import type { Tone } from "../../components/ui/tone.ts"
import { n2 } from "../clos/useClos.ts"
import type { AtRiskRow, Attainment } from "../dashboard/dashboard.types.ts"

/** Follow-up severity: the label and the chip tone (CR-05.1 order). */
export const LEVEL: Record<AtRiskRow["level"], [string, Tone]> = {
  COURSE_FAIL: ["ไม่ผ่านรายวิชา", "bad"],
  CLO_BELOW: ["ต่ำกว่าเกณฑ์ CLO", "warn"],
  OVERDUE: ["ขาดส่งงาน", "warn"],
}

/** Why this student is on the follow-up list (followWhy of the prototype). */
export function why(r: AtRiskRow, passCriteria: number) {
  const parts: string[] = []
  if (r.failedClos.length)
    parts.push(
      "ต่ำกว่าเกณฑ์ " +
        r.failedClos
          .map((c) => `CLO ${c.number}${c.provisional ? "*" : ""} (−${n2(c.gap ?? 0)})`)
          .join(", "),
    )
  else if (r.level === "COURSE_FAIL") parts.push(`คะแนนรวมต่ำกว่าเกณฑ์ผ่าน ${n2(passCriteria)}%`)
  if (r.overdue.length) parts.push(`ขาดส่ง ${r.overdue.map((o) => o.name).join(", ")}`)
  return parts.join(" · ")
}

/**
 * The CLO result can be locked (the course is not set up enough to compute it) or
 * empty (nothing scored yet). The charts under it show only when it is neither.
 */
export const attainmentState = (a: Attainment | undefined) => ({
  locked: a ? !a.meta.computable : false,
  noScores: a ? a.clos.every((c) => c.attainment === null) : true,
})
