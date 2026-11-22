/**
 * Step two of the import dialog (FR-69): send the file, get every row checked back,
 * write nothing. The roster and the scores answer in different shapes, so both are
 * mapped here to the one Preview the dialog shows.
 */
import { useMutation } from "@tanstack/react-query"
import { studentsApi } from "../students/students.api.ts"
import { scoresApi } from "./scores.api.ts"

export type ImportKind = "roster" | "scores"
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

export const useImportPreview = (kind: ImportKind, courseId: string) =>
  useMutation({
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
