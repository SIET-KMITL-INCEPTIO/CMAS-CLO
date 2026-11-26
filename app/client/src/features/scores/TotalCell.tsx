/**
 * The score table's "รวม (%)" (viewRoster of index-q.html, #33): the course
 * total the server computed (GET …/dashboard/students, FR-88) — nothing is
 * added up here. A total that is not final yet says how much of the course it
 * rests on, so a half-assessed student is not read as failing (CR-05, FR-84).
 * Colours follow index-q tone(): pass, within 10 points below the pass mark,
 * or further — pass/fail itself is the server's (coursePassed).
 */
import { n2 } from "../clos/useClos.ts"
import type { ClassResultRow } from "../dashboard/dashboard.types.ts"

/** The band of a final total (index-q tone): "ok" passed, "warn" within 10 points, "bad" further. */
const NEAR = 10

export function TotalCell({
  row,
  passCriteria,
}: {
  row: ClassResultRow | undefined
  /** The course pass mark (%), only to tell "near" from "far" in the colour. */
  passCriteria: number
}) {
  // Withdrawn, not loaded yet, or nothing scored: no total, and never a 0.
  if (!row || row.totalScore === null)
    return (
      <span className="text-dim" title={row ? "ยังไม่มีคะแนน" : undefined}>
        –
      </span>
    )
  const tone = !row.complete
    ? "text-ink"
    : row.coursePassed
      ? "text-ok"
      : row.totalScore >= passCriteria - NEAR
        ? "text-warn"
        : "text-bad"
  return (
    <>
      <span
        className={`tnum text-[14px] font-medium ${tone}`}
        title={row.complete ? (row.coursePassed ? "ผ่านรายวิชา" : "ไม่ผ่านรายวิชา") : undefined}
      >
        {n2(row.totalScore)}
      </span>
      {!row.complete && (
        <div className="tnum text-[12.5px] text-dim">
          ประเมินแล้ว {Math.round(row.assessedWeight)}%
        </div>
      )}
    </>
  )
}
