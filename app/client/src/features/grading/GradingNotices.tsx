import { TONE, type Tone } from "../../components/ui/tone.ts"
import type { Grading, GradingStudent } from "./grading.types.ts"

/** The notices between the ladder and the student table: unfinished scores, server warnings, frozen state, withdrawals. */
export function GradingNotices({
  g,
  incomplete,
  withdrawn,
  note,
  canRun,
  onUnfreeze,
}: {
  g: Grading
  /** Enrolled students whose scores are not complete. */
  incomplete: number
  withdrawn: GradingStudent[]
  note: [Tone, string] | null
  canRun: boolean
  onUnfreeze: () => void
}) {
  const pf = g.gradeScale === "PASS_FAIL"
  return (
    <>
      {incomplete > 0 && (
        <div
          className="mb-4 flex items-start gap-3 rounded-lg px-5 py-4 text-[14px]"
          style={{ background: TONE.warn.bg, color: TONE.warn.tx }}
        >
          <span>⚠</span>
          <div>
            มี {incomplete} คนที่คะแนนยังไม่ครบ — ระบบไม่ออกเกรดให้ และจะไม่แทนด้วย {pf ? "U" : "F"}
          </div>
        </div>
      )}
      {g.meta.warnings.length > 0 && (
        <div
          className="mb-4 rounded-lg px-5 py-3 text-[13px]"
          style={{ background: TONE.nil.bg, color: "var(--ink2)" }}
        >
          {g.meta.warnings.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
      )}
      {note && (
        <div
          className="mb-4 flex flex-wrap items-center gap-3 rounded-lg px-5 py-3 text-[14px]"
          style={{ background: TONE[note[0]].bg, color: TONE[note[0]].tx }}
        >
          <span className="min-w-[240px] flex-1">{note[1]}</span>
          {g.frozen && canRun && (
            <button type="button" className="btn btn-quiet no-print" onClick={onUnfreeze}>
              ยกเลิกการตรึงเกรด
            </button>
          )}
        </div>
      )}
      {withdrawn.length > 0 && (
        <div
          className="mb-4 rounded-lg px-5 py-3 text-[14px]"
          style={{ background: TONE.nil.bg, color: "var(--ink2)" }}
        >
          ถอนรายวิชา {withdrawn.length} คน — แสดง W ไม่อยู่ในการตัดเกรดและไม่นับในสถิติของกลุ่ม:{" "}
          {withdrawn.map((s) => `${s.studentCode} ${s.name}`).join(" · ")}
        </div>
      )}
    </>
  )
}
