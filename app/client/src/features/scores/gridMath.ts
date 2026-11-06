/**
 * What typing, pasting, filling and undoing do to the score grid — pure, so the
 * rules are tested without a screen. A blank cell is "not assessed yet" and
 * stays that way until a score is typed; it is never 0 (FR-62).
 */
import type { CellValue, CellWrite, GridActivity, GridStudent } from "./score.types.ts"

const EXCUSED_WORDS = new Set(["ยกเว้น", "excused", "x"])

export type Parsed = { ok: true; value: CellValue } | { ok: false; reason: string }

/** One cell's text: empty clears it, a word excuses it, a number must fit 0…full score. */
export function parseCell(text: string, max: number): Parsed {
  const t = text.trim()
  if (t === "") return { ok: true, value: null }
  if (EXCUSED_WORDS.has(t.toLowerCase())) return { ok: true, value: "EXCUSED" }
  const n = Number(t)
  if (!Number.isFinite(n)) return { ok: false, reason: "คะแนนต้องเป็นตัวเลข หรือคำว่า ยกเว้น" }
  if (n < 0) return { ok: false, reason: "คะแนนติดลบไม่ได้" }
  if (n > max) return { ok: false, reason: `คะแนนเกินคะแนนเต็ม ${max}` }
  return { ok: true, value: Math.round(n * 100) / 100 }
}

/** What a cell shows: a number, the word, or nothing. */
export const cellText = (v: CellValue | undefined) =>
  v === null || v === undefined ? "" : v === "EXCUSED" ? "ยกเว้น" : String(v)

/** Tab/newline separated text from Excel, without the empty line a copy leaves at the end. */
export function parsePaste(text: string): string[][] {
  const rows = text.replace(/\r/g, "").split("\n")
  while (rows.length > 1 && rows[rows.length - 1] === "") rows.pop()
  return rows.map((r) => r.split("\t"))
}

const sameValue = (a: CellValue | undefined, b: CellValue) => (a ?? null) === b

/** Whether a student's cell can be written at all: enrolled, and the activity still takes scores. */
export const writable = (s: GridStudent, a: GridActivity) => s.status === "ENROLLED" && !a.closedAt

export type PastePlan = { writes: CellWrite[]; problems: string[]; skipped: number }

/**
 * Pasting a block from the top-left cell: row by row down the students shown,
 * column by column across the activities. An empty pasted cell leaves the
 * existing value alone; a withdrawn student or a closed activity is skipped;
 * a bad value is reported and nothing at all is written (all or nothing).
 */
export function planPaste(
  students: GridStudent[],
  activities: GridActivity[],
  startRow: number,
  startCol: number,
  block: string[][],
): PastePlan {
  const writes: CellWrite[] = []
  const problems: string[] = []
  let skipped = 0
  block.forEach((line, i) => {
    const s = students[startRow + i]
    if (!s) return
    line.forEach((text, j) => {
      const a = activities[startCol + j]
      if (!a || text.trim() === "") return
      if (!writable(s, a)) {
        skipped++
        return
      }
      const p = parseCell(text, a.maxScore)
      if (!p.ok) {
        problems.push(`${s.studentCode} · ${a.name}: ${p.reason}`)
        return
      }
      const from = s.scores[a.id] ?? null
      if (!sameValue(from, p.value))
        writes.push({ studentId: s.id, activityId: a.id, score: p.value, from })
    })
  })
  return { writes, problems, skipped }
}

/** "เติมคะแนนเต็ม": every empty cell of the column for enrolled students becomes the full score. */
export function planFill(students: GridStudent[], a: GridActivity): CellWrite[] {
  if (a.closedAt) return []
  return students
    .filter((s) => s.status === "ENROLLED" && (s.scores[a.id] ?? null) === null)
    .map((s) => ({ studentId: s.id, activityId: a.id, score: a.maxScore, from: null }))
}

/** The write that puts a batch back: each cell returns to what it was, expecting what the batch wrote. */
export const undoOf = (writes: CellWrite[]): CellWrite[] =>
  writes.map((w) => ({
    studentId: w.studentId,
    activityId: w.activityId,
    score: w.from,
    from: w.score,
  }))

/** The blank cells of one student among the activities that take scores, for the status column. */
export function blanksOf(s: GridStudent, activities: GridActivity[]) {
  return activities.filter((a) => (s.scores[a.id] ?? null) === null).length
}
