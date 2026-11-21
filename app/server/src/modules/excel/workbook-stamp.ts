/**
 * Writes the per-download settings into a copy of the score workbook template
 * (CMAS-template.xlsm) as custom document properties, which the VBA reads with
 * ThisWorkbook.CustomDocumentProperties when the file opens.
 *
 * Only an OOXML part is added or replaced: docProps/custom.xml, plus its
 * relationship and content type when the template has none. The VBA project
 * and every other part are copied byte for byte.
 *
 * SheetJS's CFB (already a dependency through `xlsx`) reads and writes the ZIP,
 * so no second ZIP library is needed.
 */
import * as XLSX from "xlsx"

const CFB = XLSX.CFB
const CUSTOM_PART = "docProps/custom.xml"
const CUSTOM_REL_TYPE =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties"
const CUSTOM_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.custom-properties+xml"
// The format id every custom property carries (ECMA-376 Part 1, 22.3.2.2).
const FMTID = "{D5CDD505-2E9C-101B-9397-08002B2CF9AE}"

// XML 1.0 has no control characters but tab, LF and CR.
const isXmlChar = (c: string) => c.charCodeAt(0) >= 0x20 || c === "\t" || c === "\n" || c === "\r"

const escapeXml = (s: string) =>
  [...s]
    .filter(isXmlChar)
    .join("")
    .replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`)

export function customPropertiesXml(props: Record<string, string>): string {
  const items = Object.entries(props)
    .map(
      ([name, value], i) =>
        `<property fmtid="${FMTID}" pid="${i + 2}" name="${escapeXml(name)}"><vt:lpwstr>${escapeXml(value)}</vt:lpwstr></property>`,
    )
    .join("")
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' +
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" ' +
    'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
    items +
    "</Properties>"
  )
}

export function addCustomRelationship(rels: string): string {
  if (rels.includes(CUSTOM_REL_TYPE)) return rels
  if (!rels.includes("</Relationships>")) throw new Error("_rels/.rels has no </Relationships>")
  const rel = `<Relationship Id="cmasCustomProps" Type="${CUSTOM_REL_TYPE}" Target="${CUSTOM_PART}"/>`
  return rels.replace("</Relationships>", rel + "</Relationships>")
}

export function addCustomContentType(types: string): string {
  if (types.includes(`PartName="/${CUSTOM_PART}"`)) return types
  if (!types.includes("</Types>")) throw new Error("[Content_Types].xml has no </Types>")
  const override = `<Override PartName="/${CUSTOM_PART}" ContentType="${CUSTOM_CONTENT_TYPE}"/>`
  return types.replace("</Types>", override + "</Types>")
}

const text = (entry: { content: unknown } | null) =>
  entry ? Buffer.from(entry.content as Uint8Array).toString("utf8") : null

/** A copy of `template` (an .xlsm) whose custom document properties are exactly `props`. */
export function stampWorkbook(template: Buffer, props: Record<string, string>): Buffer {
  const zip = CFB.read(template, { type: "buffer" })
  const rels = text(CFB.find(zip, "/_rels/.rels"))
  const types = text(CFB.find(zip, "/[Content_Types].xml"))
  if (!rels || !types || !CFB.find(zip, "/xl/vbaProject.bin"))
    throw new Error("not a macro-enabled workbook")

  const put = (path: string, body: string) => {
    if (CFB.find(zip, path)) CFB.utils.cfb_del(zip, path)
    CFB.utils.cfb_add(zip, path, Buffer.from(body, "utf8"))
  }
  put("/_rels/.rels", addCustomRelationship(rels))
  put("/[Content_Types].xml", addCustomContentType(types))
  put(`/${CUSTOM_PART}`, customPropertiesXml(props))
  return Buffer.from(CFB.write(zip, { fileType: "zip", type: "buffer", compression: true }))
}

/** The custom properties of a workbook, for tests. */
export function readCustomProperties(workbook: Buffer): Record<string, string> {
  const xml = text(CFB.find(CFB.read(workbook, { type: "buffer" }), `/${CUSTOM_PART}`)) ?? ""
  const out: Record<string, string> = {}
  for (const m of xml.matchAll(/name="([^"]*)"><vt:lpwstr>([^<]*)<\/vt:lpwstr>/g)) {
    out[m[1]!] = m[2]!.replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
  }
  return out
}
