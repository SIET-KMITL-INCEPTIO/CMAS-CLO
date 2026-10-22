/**
 * The score table of index-q.html (viewRoster): one row per student, one column
 * per activity. Typing, arrow keys, Enter and pasting a block from Excel all
 * write through PUT /scores with what the screen last saw (D-3), so a cell
 * somebody else changed answers 409 instead of being overwritten. A blank is
 * "not assessed yet", never 0 (FR-62); "ยกเว้น" takes the activity out for that
 * student. Undo puts the last batch back.
 */
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Chip } from "../../components/ui/Badges.tsx"
import { n2 } from "../clos/useClos.ts"
import { ApiError } from "../../lib/apiClient.ts"
import {
  blanksOf,
  cellText,
  parseCell,
  parsePaste,
  planFill,
  planPaste,
  undoOf,
  writable,
} from "./gridMath.ts"
import type {
  CellWrite,
  ConflictCells,
  Grid,
  GridActivity,
  GridStudent,
  RefusedCells,
  WriteSource,
} from "./score.types.ts"
import { useReopenActivity, usePutScores } from "./useScores.ts"
import { CloseActivity } from "./CloseActivity.tsx"

type Batch = { writes: CellWrite[]; source: WriteSource }
type StudentActions = {
  edit: (s: GridStudent) => void
  withdraw: (s: GridStudent) => void
  restore: (s: GridStudent) => void
  remove: (s: GridStudent) => void
}

/** One cell. Its draft lives only while it is being edited; otherwise the saved value shows. */
function Cell({
  row,
  col,
  value,
  disabled,
  label,
  max,
  onCommit,
  onPaste,
  onMove,
}: {
  row: number
  col: number
  value: string
  disabled: boolean
  label: string
  max: number
  onCommit: (text: string) => void
  onPaste: (text: string) => boolean
  onMove: (row: number, col: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? value
  const bad = draft !== null && !parseCell(draft, max).ok
  const commit = () => {
    if (draft === null) return
    if (!bad && draft.trim() !== value) onCommit(draft)
    else if (bad) toast.error(`${label}: ${(parseCell(draft, max) as { reason: string }).reason}`)
    setDraft(null)
  }
  return (
    <input
      className={`cellinp ${value === "" ? "empty" : ""}`}
      data-cell={`${row}:${col}`}
      value={text}
      placeholder="–"
      inputMode="decimal"
      aria-label={label}
      aria-invalid={bad || undefined}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onPaste={(e) => {
        const t = e.clipboardData.getData("text")
        // A single value pastes like typing; a block goes through the plan.
        if (/[\t\n]/.test(t.trim()) && onPaste(t)) e.preventDefault()
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setDraft(null)
          e.currentTarget.blur()
        } else if (e.key === "Enter" || e.key === "ArrowDown") {
          e.preventDefault()
          commit()
          onMove(row + 1, col)
        } else if (e.key === "ArrowUp") {
          e.preventDefault()
          commit()
          onMove(row - 1, col)
        }
      }}
    />
  )
}

export function ScoreGrid({
  courseId,
  grid,
  canEdit,
  canManage,
  actions,
}: {
  courseId: string
  grid: Grid
  canEdit: boolean
  canManage: boolean
  actions: StudentActions
}) {
  const { activities, students, meta } = grid
  const put = usePutScores(courseId)
  const reopen = useReopenActivity()
  const [undo, setUndo] = useState<Batch[]>([])
  const [closing, setClosing] = useState<GridActivity | null>(null)
  const box = useRef<HTMLDivElement>(null)

  const move = (row: number, col: number) =>
    requestAnimationFrame(() =>
      box.current?.querySelector<HTMLInputElement>(`[data-cell="${row}:${col}"]`)?.focus(),
    )

  /** Every cell the server refused (422) or somebody else changed (409), in one message. */
  const explain = (err: Error) => {
    if (err instanceof ApiError && err.status === 422) {
      const rows = (err.errors as RefusedCells | undefined)?.rows ?? []
      const first = rows.slice(0, 3).map((r) => r.reason)
      toast.error(
        [err.message, ...first, rows.length > 3 ? `และอีก ${rows.length - 3} ช่อง` : ""]
          .filter(Boolean)
          .join(" · "),
      )
    } else if (err instanceof ApiError && err.status === 409) {
      const n = (err.errors as ConflictCells | undefined)?.cells.length ?? 0
      toast.error(`${err.message}${n ? ` (${n} ช่อง)` : ""}`)
    } else toast.error(err.message)
  }

  const write = (writes: CellWrite[], source: WriteSource, after?: () => void) => {
    if (!writes.length) return
    put.mutate(
      { scores: writes, source },
      {
        onSuccess: () => {
          after?.()
        },
        onError: explain,
      },
    )
  }
  const commitBatch = (writes: CellWrite[], source: WriteSource) =>
    write(writes, source, () => setUndo((u) => [...u.slice(-19), { writes, source }]))

  const onCommit = (s: GridStudent, a: GridActivity, text: string) => {
    const p = parseCell(text, a.maxScore)
    if (!p.ok) return
    commitBatch(
      [{ studentId: s.id, activityId: a.id, score: p.value, from: s.scores[a.id] ?? null }],
      "MANUAL",
    )
  }

  const onPaste = (row: number, col: number, text: string) => {
    const plan = planPaste(students, activities, row, col, parsePaste(text))
    if (plan.problems.length) {
      toast.error(
        `วางไม่ได้ — ${plan.problems.slice(0, 3).join(" · ")}${plan.problems.length > 3 ? ` และอีก ${plan.problems.length - 3} ช่อง` : ""}`,
      )
      return true
    }
    if (!plan.writes.length) {
      toast.message(
        plan.skipped
          ? `ข้าม ${plan.skipped} ช่อง (ถอนรายวิชาหรือปิดรับคะแนนแล้ว)`
          : "ไม่มีช่องที่เปลี่ยน",
      )
      return true
    }
    commitBatch(plan.writes, "PASTE")
    if (plan.skipped) toast.message(`ข้าม ${plan.skipped} ช่อง (ถอนรายวิชาหรือปิดรับคะแนนแล้ว)`)
    return true
  }

  const fill = (a: GridActivity) => {
    const writes = planFill(students, a)
    if (!writes.length) return toast.message("ไม่มีช่องว่างให้เติม")
    commitBatch(writes, "FILL")
  }

  const undoLast = () => {
    const last = undo[undo.length - 1]
    if (!last) return
    write(undoOf(last.writes), last.source === "FILL" ? "FILL_UNDO" : "UNDO", () =>
      setUndo((u) => u.slice(0, -1)),
    )
  }

  const blanksIn = (a: GridActivity) =>
    students.filter((s) => s.status === "ENROLLED" && (s.scores[a.id] ?? null) === null).length

  const enrolledBlanks = (s: GridStudent) => blanksOf(s, activities)

  return (
    <div ref={box}>
      {canEdit && (
        <div className="no-print mb-2 flex flex-wrap items-center gap-2 text-[13px] text-dim">
          <button
            type="button"
            className="btn"
            onClick={undoLast}
            disabled={undo.length === 0 || put.isPending}
          >
            เลิกทำ{undo.length ? ` (${undo.length})` : ""}
          </button>
          <span>
            พิมพ์คะแนนแล้วกด Enter · วางจาก Excel ได้ทั้งบล็อก · ช่องว่าง = ยังไม่ประเมิน · พิมพ์
            “ยกเว้น” เพื่อไม่นับช่องนั้น
          </span>
        </div>
      )}
      <div className="card scroll-x">
        <table className="dt">
          <thead>
            <tr>
              <th className="who sticky left-0 z-10 bg-white">รหัส · ชื่อ-สกุล</th>
              {activities.map((a) => {
                const pr = meta.progress[a.id]
                return (
                  <th key={a.id} className="num" style={{ minWidth: 96 }}>
                    <div className="max-w-[140px] truncate" title={a.name}>
                      {a.name}
                    </div>
                    <div className="tnum text-[12px] font-normal tracking-normal text-faint normal-case">
                      เต็ม {n2(a.maxScore)}
                      {pr ? ` · ${pr.scored}/${pr.total}` : ""}
                    </div>
                    {a.closedAt && (
                      <div className="mt-0.5">
                        <Chip tone="nil" title={`ปิดรับคะแนน ${a.closedAt.slice(0, 10)}`}>
                          ปิดรับแล้ว
                        </Chip>
                      </div>
                    )}
                    {canEdit && (
                      <div className="no-print mt-1 flex justify-end gap-1 text-[12px] font-normal tracking-normal normal-case">
                        {!a.closedAt && (
                          <button
                            type="button"
                            className="text-dim underline underline-offset-2 hover:text-ink"
                            onClick={() => fill(a)}
                            title="เติมคะแนนเต็มให้ช่องว่างของนักศึกษาที่ลงทะเบียนอยู่"
                          >
                            เติมเต็ม
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-dim underline underline-offset-2 hover:text-ink"
                          onClick={() =>
                            a.closedAt
                              ? reopen.mutate(a.id, {
                                  onSuccess: () => toast.success(`เปิดรับคะแนน ${a.name} แล้ว`),
                                  onError: (err) => toast.error(err.message),
                                })
                              : setClosing(a)
                          }
                        >
                          {a.closedAt ? "เปิดรับ" : "ปิดรับ"}
                        </button>
                      </div>
                    )}
                  </th>
                )
              })}
              <th style={{ width: 150 }}>สถานะ</th>
              {canManage && <th className="no-print" style={{ width: 170 }} />}
            </tr>
          </thead>
          <tbody>
            {students.map((s, r) => {
              const withdrawn = s.status === "WITHDRAWN"
              const blanks = enrolledBlanks(s)
              return (
                <tr key={s.id} className={withdrawn ? "text-dim" : undefined}>
                  <td className="who sticky left-0 z-10 bg-white">
                    <span className="nm block">{s.name}</span>
                    <span className="code">{s.studentCode}</span>
                  </td>
                  {activities.map((a, c) => (
                    <td key={a.id} className="num scorecell">
                      <Cell
                        row={r}
                        col={c}
                        value={cellText(s.scores[a.id])}
                        disabled={!canEdit || !writable(s, a)}
                        label={`คะแนน ${s.studentCode} · ${a.name}`}
                        max={a.maxScore}
                        onCommit={(t) => onCommit(s, a, t)}
                        onPaste={(t) => onPaste(r, c, t)}
                        onMove={move}
                      />
                    </td>
                  ))}
                  <td>
                    {withdrawn ? (
                      <Chip tone="nil">ถอนรายวิชา</Chip>
                    ) : blanks === 0 ? (
                      <Chip tone="ok">คะแนนครบ</Chip>
                    ) : (
                      <Chip tone="info">รอ {blanks} ช่อง</Chip>
                    )}
                  </td>
                  {canManage && (
                    <td className="no-print">
                      <div className="flex justify-end gap-0.5">
                        <button
                          type="button"
                          className="btn btn-quiet"
                          onClick={() => actions.edit(s)}
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          className="btn btn-quiet"
                          onClick={() => (withdrawn ? actions.restore(s) : actions.withdraw(s))}
                        >
                          {withdrawn ? "คืนสถานะ" : "ถอน"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-quiet btn-danger"
                          onClick={() => actions.remove(s)}
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {closing && (
        <CloseActivity
          activity={closing}
          blanks={blanksIn(closing)}
          onClose={() => setClosing(null)}
        />
      )}
    </div>
  )
}
