/** The smallest ZIP that workbook-stamp.ts accepts as a macro-enabled workbook. */
import * as XLSX from "xlsx"

export function fakeXlsm(
  parts: Record<string, string> = {
    "[Content_Types].xml":
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>',
    "_rels/.rels":
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>',
    "xl/vbaProject.bin": "pretend VBA",
  },
): Buffer {
  const zip = XLSX.CFB.utils.cfb_new()
  for (const [path, body] of Object.entries(parts))
    XLSX.CFB.utils.cfb_add(zip, `/${path}`, Buffer.from(body, "utf8"))
  return Buffer.from(XLSX.CFB.write(zip, { fileType: "zip", type: "buffer" }))
}
