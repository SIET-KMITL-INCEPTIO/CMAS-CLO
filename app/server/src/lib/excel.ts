/**
 * Excel in and out (S-6, S-7). Shared by the roster and score imports and
 * every export, so the safety rules live in one place.
 *
 * In:  .xlsx only, recognised by its magic bytes (a ZIP), never by name or
 *      MIME · at most 5 sheets and 2,000 data rows · a formula anywhere is
 *      refused, not evaluated · the file is parsed in memory and never stored.
 * Out: a text cell that starts with = + - @ is prefixed with ' so a name a
 *      user typed cannot run as a formula when someone opens the export.
 */
import * as XLSX from "xlsx"
import { BadRequestError } from "./errors.js"

export const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
export const MAX_ROWS = 2000
const MAX_SHEETS = 5
/** The header block the faculty's form puts above the table (index-q.sql: first data row 14). */
const HEADER_SEARCH_ROWS = 30
export const STUDENT_CODE_HEADER = "รหัสนักศึกษา"
export const NAME_HEADER = "ชื่อ-นามสกุล"

/** A file the import refuses as a whole (400), before any row is looked at. */
export class ExcelFileError extends BadRequestError {}

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]
export const isXlsx = (buf: Buffer) => ZIP_MAGIC.every((b, i) => buf[i] === b)

export type Table = {
  /** Excel row number of the header row, 1-based, as the instructor sees it. */
  headerRow: number
  headers: string[]
  rows: { row: number; cells: unknown[] }[]
}

/**
 * Reads the first sheet's table: the header row is the first row (within the
 * first 30) whose first cell is "รหัสนักศึกษา", so both the faculty form and a
 * bare table with headers on row 1 are read the same way.
 */
export function readTable(buf: Buffer): Table {
  if (!isXlsx(buf)) throw new ExcelFileError("ไฟล์ต้องเป็น Excel (.xlsx)")
  let wb: XLSX.WorkBook
  try {
    wb = XLSX.read(buf, { type: "buffer", cellFormula: true, cellHTML: false, dense: true })
  } catch {
    throw new ExcelFileError("อ่านไฟล์ Excel ไม่ได้")
  }
  if (wb.SheetNames.length > MAX_SHEETS)
    throw new ExcelFileError(`ไฟล์มีได้ไม่เกิน ${MAX_SHEETS} ชีต`)

  const sheet = wb.Sheets[wb.SheetNames[0]!]!
  const dense = (sheet as unknown as { "!data"?: (XLSX.CellObject | undefined)[][] })["!data"] ?? []
  for (const row of dense) {
    if (row?.some((c) => c?.f))
      throw new ExcelFileError("ไฟล์มีสูตร — วางเป็นค่า (Paste values) แล้วนำเข้าใหม่")
  }

  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
  })
  const headerIndex = grid
    .slice(0, HEADER_SEARCH_ROWS)
    .findIndex((r) => String(r?.[0] ?? "").trim() === STUDENT_CODE_HEADER)
  if (headerIndex < 0)
    throw new ExcelFileError(`ไม่พบหัวคอลัมน์ "${STUDENT_CODE_HEADER}" ในคอลัมน์ A`)

  const rows = grid
    .slice(headerIndex + 1)
    .map((cells, i) => ({ row: headerIndex + 2 + i, cells: cells ?? [] }))
    .filter((r) => r.cells.some((c) => c !== null && String(c).trim() !== ""))
  if (rows.length > MAX_ROWS) throw new ExcelFileError(`ไฟล์มีได้ไม่เกิน ${MAX_ROWS} แถว`)

  return {
    headerRow: headerIndex + 1,
    headers: (grid[headerIndex] ?? []).map((h) => String(h ?? "").trim()),
    rows,
  }
}

/** A student code as text: Excel turns 6604101001 into a number, and 0-led codes lose their zero. */
export const asText = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim())

/** S-7: neutralise a text cell a spreadsheet would read as a formula. */
export const safeText = (v: string) => (/^[=+\-@]/.test(v) ? `'${v}` : v)

type Cell = string | number | null
const sanitize = (row: Cell[]) => row.map((c) => (typeof c === "string" ? safeText(c) : c))

/**
 * A workbook in the faculty's layout: a header block (title + label/value
 * lines), a blank row, then the table. Codes are written as text cells.
 */
export function buildWorkbook(
  sheets: {
    name: string
    title: string
    info: [string, string][]
    head: string[]
    rows: Cell[][]
  }[],
): Buffer {
  const wb = XLSX.utils.book_new()
  for (const s of sheets) {
    const aoa: Cell[][] = [
      [safeText(s.title)],
      [],
      ...s.info.map(([k, v]) => sanitize([k, v])),
      [],
      sanitize(s.head),
      ...s.rows.map(sanitize),
    ]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    ws["!cols"] = s.head.map((_, i) => ({ wch: i === 1 ? 28 : 16 }))
    // Column A is codes: text, so a leading zero survives a round trip.
    const first = aoa.length - s.rows.length
    s.rows.forEach((_, i) => {
      const ref = XLSX.utils.encode_cell({ r: first + i, c: 0 })
      const cell = ws[ref] as XLSX.CellObject | undefined
      if (cell) {
        cell.t = "s"
        cell.v = String(cell.v)
        cell.z = "@"
      }
    })
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31))
  }
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer
}

/** "<name> (เต็ม N) [id]" — the id lets an import find the column even after a rename. */
export const activityHeader = (a: { id: string; name: string; maxScore: number }) =>
  `${a.name} (เต็ม ${a.maxScore}) [${a.id}]`

export const fileStamp = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")
