export type StudentInput = { studentCode: string; name: string }

export type RosterImportPreview = {
  previewToken: string
  summary: { total: number; add: number; failed: number }
  rows: {
    row: number
    studentCode: string
    name: string
    status: "ADD" | "EXISTS" | "ERROR"
    errorCode: string | null
    message: string | null
  }[]
}
