/** A cell as the grid and the API speak it: a score, "EXCUSED", or null = not assessed yet (FR-62, never 0). */
export type CellValue = number | "EXCUSED" | null

/** GET /courses/:courseId/scores — ScoreService.grid. */
export type GridActivity = {
  id: string
  name: string
  maxScore: number
  passScore: number
  closedAt: string | null
}
export type GridStudent = {
  id: string
  studentCode: string
  name: string
  status: "ENROLLED" | "WITHDRAWN"
  scores: Record<string, CellValue>
}
export type GridMeta = {
  total: number
  page: number
  perPage: number
  /** Per activity: how many enrolled students have a row, of how many. */
  progress: Record<string, { scored: number; total: number }>
}
export type Grid = { activities: GridActivity[]; students: GridStudent[]; meta: GridMeta }

export type CellWrite = {
  studentId: string
  activityId: string
  score: CellValue
  /** D-3: what this screen last saw; a different value in the database answers 409. */
  from: CellValue
  reason?: string
}
export type WriteSource = "MANUAL" | "PASTE" | "FILL" | "FILL_UNDO" | "UNDO"

/** 422 detail of PUT /scores: every cell that was refused, with the reason (FR-63). */
export type RefusedCells = { rows: { studentId: string; activityId: string; reason: string }[] }
/** 409 detail: cells somebody else changed meanwhile. */
export type ConflictCells = {
  cells: { studentId: string; activityId: string; current: CellValue }[]
}

export type CloseBlank = "ZERO" | "EXCUSED" | "LATER"
