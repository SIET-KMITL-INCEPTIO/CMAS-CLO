import * as XLSX from "xlsx"
import { describe, expect, it } from "vitest"
import { fakeXlsm } from "../../test/fake-xlsm.js"
import {
  addCustomContentType,
  addCustomRelationship,
  customPropertiesXml,
  readCustomProperties,
  stampWorkbook,
} from "./workbook-stamp.js"

const part = (zip: Buffer, path: string) => {
  const entry = XLSX.CFB.find(XLSX.CFB.read(zip, { type: "buffer" }), `/${path}`)
  return entry ? Buffer.from(entry.content as Uint8Array).toString("utf8") : null
}

describe("stampWorkbook", () => {
  it("adds the properties, their relationship and their content type", () => {
    const out = stampWorkbook(fakeXlsm(), { CmasCourseId: "c1", CmasTicket: "t" })
    expect(readCustomProperties(out)).toEqual({ CmasCourseId: "c1", CmasTicket: "t" })
    expect(part(out, "_rels/.rels")).toContain('Target="docProps/custom.xml"')
    expect(part(out, "[Content_Types].xml")).toContain('PartName="/docProps/custom.xml"')
  })

  it("copies the VBA project byte for byte", () => {
    expect(part(stampWorkbook(fakeXlsm(), {}), "xl/vbaProject.bin")).toBe("pretend VBA")
  })

  it("replaces the properties of a file already stamped, without a second relationship", () => {
    const twice = stampWorkbook(stampWorkbook(fakeXlsm(), { CmasTicket: "old" }), {
      CmasTicket: "new",
    })
    expect(readCustomProperties(twice)).toEqual({ CmasTicket: "new" })
    expect(part(twice, "_rels/.rels")!.match(/custom-properties/g)).toHaveLength(1)
    expect(part(twice, "[Content_Types].xml")!.match(/custom\.xml/g)).toHaveLength(1)
  })

  it("refuses a file with no VBA project", () => {
    const parts = {
      "[Content_Types].xml": "<Types></Types>",
      "_rels/.rels": "<Relationships></Relationships>",
    }
    expect(() => stampWorkbook(fakeXlsm(parts), {})).toThrow(/macro-enabled/)
  })
})

describe("customPropertiesXml", () => {
  it("escapes what would break the XML, and keeps Thai", () => {
    const xml = customPropertiesXml({ CmasCourseLabel: `วิชา <a> & "b"\u0001` })
    expect(xml).not.toContain("<a>")
    expect(xml).not.toContain("\u0001")
    const zip = stampWorkbook(fakeXlsm(), { CmasCourseLabel: `วิชา <a> & "b"` })
    expect(readCustomProperties(zip).CmasCourseLabel).toBe(`วิชา <a> & "b"`)
  })

  it("numbers properties from pid 2, as Office does", () => {
    expect(customPropertiesXml({ A: "1", B: "2" })).toMatch(/pid="2".*pid="3"/)
  })
})

describe("relationships and content types", () => {
  it("refuse a part that is not what it should be", () => {
    expect(() => addCustomRelationship("<x/>")).toThrow()
    expect(() => addCustomContentType("<x/>")).toThrow()
  })
})
