/**
 * A-12 · NFR-16: the ONE way a Score row changes. Typed in the grid, pasted,
 * imported, filled, decided when an activity closes — every path calls
 * writeCells inside its transaction, which writes the cells and their
 * ScoreChange rows together. An unchanged cell writes nothing.
 *
 * Bulk on purpose: an import of 500 rows (NFR-03, 10 s) cannot afford one
 * round trip per cell, so the upsert is a single INSERT ... ON CONFLICT over
 * arrays and the history a single createMany.
 */
import { randomUUID } from "node:crypto"
import { Prisma, type ScoreChangeSource } from "@prisma/client"

/** A cell's value: a score, excused (with an optional reason), or empty (null). */
export type CellValue = { score: number; excused: false } | { excused: true; reason: string | null }

export type CellWrite = {
  studentId: string
  activityId: string
  from: CellValue | null
  to: CellValue | null
}

type Tx = Prisma.TransactionClient

const newId = () => `c${randomUUID().replace(/-/g, "").slice(0, 24)}`

export const sameValue = (a: CellValue | null, b: CellValue | null) => {
  if (a === null || b === null) return a === b
  if (a.excused || b.excused) return a.excused && b.excused && a.reason === b.reason
  return a.score === b.score
}

/** Returns how many cells actually changed. */
export async function writeCells(
  tx: Tx,
  writes: CellWrite[],
  source: ScoreChangeSource,
  changedBy: string,
  logId: string | null = null,
): Promise<number> {
  const changed = writes.filter((w) => !sameValue(w.from, w.to))
  if (changed.length === 0) return 0

  const cleared = changed.filter((w) => w.to === null)
  if (cleared.length) {
    await tx.score.deleteMany({
      where: { OR: cleared.map((w) => ({ studentId: w.studentId, activityId: w.activityId })) },
    })
  }

  const set = changed.filter((w): w is CellWrite & { to: CellValue } => w.to !== null)
  if (set.length) {
    const ids = set.map(newId)
    const students = set.map((w) => w.studentId)
    const activities = set.map((w) => w.activityId)
    const scores = set.map((w) => (w.to.excused ? null : w.to.score))
    const statuses = set.map((w) => (w.to.excused ? "EXCUSED" : "SCORED"))
    const reasons = set.map((w) => (w.to.excused ? w.to.reason : null))
    // The trigger from 0002 still checks score <= maxScore and same course, row by row.
    await tx.$executeRaw`
      INSERT INTO "Score" (id, "studentId", "activityId", score, status, "excuseReason", "uploadedAt")
      SELECT u.id, u.sid, u.aid, u.score, u.status::"ScoreStatus", u.reason, now()
      FROM unnest(${ids}::text[], ${students}::text[], ${activities}::text[],
                  ${scores}::float8[], ${statuses}::text[], ${reasons}::text[])
           AS u(id, sid, aid, score, status, reason)
      ON CONFLICT ("studentId", "activityId") DO UPDATE
        SET score = EXCLUDED.score, status = EXCLUDED.status,
            "excuseReason" = EXCLUDED."excuseReason", "uploadedAt" = now()`
  }

  await tx.scoreChange.createMany({
    data: changed.map((w) => ({
      studentId: w.studentId,
      activityId: w.activityId,
      fromScore: w.from && !w.from.excused ? w.from.score : null,
      fromExcused: w.from?.excused ?? false,
      toScore: w.to && !w.to.excused ? w.to.score : null,
      toExcused: w.to?.excused ?? false,
      source: source === "MANUAL" && w.from?.excused && w.to?.excused ? "NOTE" : source,
      note: w.to?.excused ? w.to.reason : null,
      changedBy,
      logId,
    })),
  })
  return changed.length
}

/** The stored value of a Score row, in the writer's terms. */
export const cellOf = (row: {
  score: number | null
  status: string
  excuseReason: string | null
}): CellValue =>
  row.status === "EXCUSED"
    ? { excused: true, reason: row.excuseReason }
    : { score: row.score ?? 0, excused: false }
