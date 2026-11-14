/**
 * modalImport of index-q.html: three steps for both the roster and the scores —
 * choose the file, check it, confirm. Nothing is written until the last step
 * (FR-69); an empty cell in the file never overwrites a score (FR-62); the rows
 * that failed come back as a file to correct (FR-65).
 */
import { useMutation } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Modal } from "../../components/overlay/Sheet.tsx"
import { Chip } from "../../components/ui/Badges.tsx"
import { studentsApi } from "../students/students.api.ts"
import { useCommitRosterImport } from "../students/useStudents.ts"
import { scoresApi } from "./scores.api.ts"
import { useCommitScoreImport } from "./useScores.ts"

type Kind = "roster" | "scores"
type Row = {
  row: number
  studentCode: string
  status: string
  message: string | null
  extra?: string
}
type Preview = {
  previewToken: string
  summary: { total: number; ok: number; failed: number }
  rows: Row[]
  notes: string[]
}

const COPY: Record<Kind, { title: string; template: string; okWord: string }> = {
  roster: {
    title: "นำเข้ารายชื่อจาก Excel",
    template: "ดาวน์โหลดเทมเพลตรายชื่อ",
    okWord: "เพิ่มได้",
  },
  scores: { title: "นำเข้าคะแนนจาก Excel", template: "ดาวน์โหลดเทมเพลตคะแนน", okWord: "บันทึกได้" },
}

export function ImportExcel({
  kind,
  courseId,
  onClose,
}: {
  kind: Kind
  courseId: string
  onClose: () => void
}) {
  const copy = COPY[kind]
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [done, setDone] = useState<{ ok: number; failed: number; uploadLogId?: string } | null>(
    null,
  )
  const commitRoster = useCommitRosterImport(courseId)
  const commitScores = useCommitScoreImport(courseId)

  const check = useMutation({
    meta: { silent: true },
    mutationFn: async (f: File): Promise<Preview> => {
      if (kind === "roster") {
        const r = await studentsApi.previewImport(courseId, f)
        return {
          previewToken: r.previewToken,
          summary: { total: r.summary.total, ok: r.summary.add, failed: r.summary.failed },
          rows: r.rows.map((x) => ({
            row: x.row,
            studentCode: x.studentCode,
            status: x.status === "ERROR" ? "ERROR" : x.status === "EXISTS" ? "SKIP" : "OK",
            message: x.message,
            extra: x.name,
          })),
          notes: [],
        }
      }
      const r = await scoresApi.previewImport(courseId, f)
      return {
        previewToken: r.previewToken,
        summary: r.summary,
        rows: r.rows.map((x) => ({
          row: x.row,
          studentCode: x.studentCode,
          status: x.status,
          message: x.message,
          extra: `${Object.keys(x.values).length} ช่อง`,
        })),
        notes: r.columns
          .filter((c) => !c.matched)
          .map((c) => `คอลัมน์ “${c.header}” ไม่ตรงกับกิจกรรมใด`),
      }
    },
  })
  const preview = check.data
  const committing = commitRoster.isPending || commitScores.isPending

  const commit = () => {
    if (!preview) return
    const finish = (r: unknown) => {
      const x = (r ?? {}) as {
        recordsOk?: number
        recordsFail?: number
        uploadLogId?: string
        written?: number
      }
      setDone({
        ok: x.recordsOk ?? x.written ?? preview.summary.ok,
        failed: x.recordsFail ?? preview.summary.failed,
        uploadLogId: x.uploadLogId,
      })
    }
    const opts = { onSuccess: finish, onError: (err: Error) => toast.error(err.message) }
    if (kind === "roster") commitRoster.mutate(preview.previewToken, opts)
    else commitScores.mutate(preview.previewToken, opts)
  }

  const template = () =>
    (kind === "roster" ? studentsApi.template(courseId) : scoresApi.template(courseId)).catch(
      (e: Error) => toast.error(e.message),
    )

  return (
    <Modal
      open
      onClose={onClose}
      title={copy.title}
      sub={
        done
          ? "นำเข้าเสร็จแล้ว"
          : preview
            ? `ขั้นที่ 2 จาก 3 · ตรวจไฟล์ ${file?.name ?? ""}`
            : "ขั้นที่ 1 จาก 3 · เลือกไฟล์"
      }
      footer={
        done ? (
          <button type="button" className="btn btn-primary" onClick={onClose}>
            ปิด
          </button>
        ) : (
          <>
            <button type="button" className="btn" onClick={onClose}>
              ยกเลิก
            </button>
            {preview && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={committing || preview.summary.ok === 0}
                onClick={commit}
              >
                ยืนยันนำเข้า {preview.summary.ok} {kind === "roster" ? "คน" : "แถว"}
              </button>
            )}
          </>
        )
      }
    >
      {done ? (
        <div className="space-y-3 text-[14px]">
          <div className="rounded-lg bg-okBg px-4 py-3 text-ok">
            {copy.okWord} {done.ok} {kind === "roster" ? "คน" : "แถว"}
            {done.failed > 0 && <span className="text-bad"> · ไม่ผ่าน {done.failed} แถว</span>}
          </div>
          {done.failed > 0 && done.uploadLogId && (
            <button
              type="button"
              className="btn"
              onClick={() =>
                scoresApi
                  .uploadErrors(done.uploadLogId!)
                  .catch((e: Error) => toast.error(e.message))
              }
            >
              ดาวน์โหลดรายงานแถวที่ไม่ผ่าน
            </button>
          )}
        </div>
      ) : !preview ? (
        <div className="space-y-4">
          <button type="button" className="btn" onClick={template}>
            {copy.template}
          </button>
          <div>
            <input
              ref={input}
              type="file"
              accept=".xlsx"
              className="block text-[14px]"
              aria-label="เลือกไฟล์ Excel"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div className="mt-1 text-[13px] text-dim">
              ไฟล์ .xlsx ขนาดไม่เกิน 10 MB · ยังไม่บันทึกอะไรจนกว่าจะยืนยัน
            </div>
          </div>
          {check.error && <div className="ferr">{check.error.message}</div>}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!file || check.isPending}
            onClick={() => file && check.mutate(file)}
          >
            ตรวจไฟล์
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-[14px]">
            <Chip tone="info">ทั้งหมด {preview.summary.total} แถว</Chip>
            <Chip tone="ok">
              {copy.okWord} {preview.summary.ok}
            </Chip>
            {preview.summary.failed > 0 && <Chip tone="bad">ไม่ผ่าน {preview.summary.failed}</Chip>}
          </div>
          {preview.notes.map((n) => (
            <div key={n} className="text-[13px] text-warn">
              {n}
            </div>
          ))}
          <div className="scroll-x max-h-[40vh] overflow-y-auto">
            <table className="dt">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>แถว</th>
                  <th>รหัส</th>
                  <th>ผล</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.row}>
                    <td className="tnum text-dim">{r.row}</td>
                    <td className="tnum">
                      {r.studentCode || "—"}
                      {r.extra && <span className="ml-2 text-[13px] text-dim">{r.extra}</span>}
                    </td>
                    <td className="text-[13px]">
                      {r.status === "ERROR" ? (
                        <span className="text-bad">{r.message}</span>
                      ) : r.status === "SKIP" ? (
                        <span className="text-dim">{r.message}</span>
                      ) : (
                        <span className="text-ok">ผ่าน</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  )
}
