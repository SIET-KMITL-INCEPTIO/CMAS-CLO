import { deflateRawSync } from "node:zlib"
import { describe, expect, it } from "vitest"
import * as XLSX from "xlsx"
import { readTable } from "./excel.js"
import { inspectXlsxContainer } from "./xlsx-container.js"

type Entry = {
  name: string
  data: Buffer
  /** 0 stored, 8 deflate; anything else is written as given (an unsupported method). */
  method?: number
  /** General-purpose flags; bit 0 = encrypted. */
  flags?: number
  /** Bytes to store as the entry's data instead of compressing `data`. */
  raw?: Buffer
}

/** A minimal ZIP writer, so each case can build exactly the archive it needs. */
function zip(entries: Entry[]): Buffer {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0
  for (const e of entries) {
    const method = e.method ?? 8
    const body = e.raw ?? (method === 8 ? deflateRawSync(e.data) : e.data)
    const name = Buffer.from(e.name, "utf8")

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(method, 8)
    local.writeUInt32LE(body.length, 18)
    local.writeUInt32LE(e.data.length, 22)
    local.writeUInt16LE(name.length, 26)
    locals.push(local, name, body)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(e.flags ?? 0, 8)
    central.writeUInt16LE(method, 10)
    central.writeUInt32LE(body.length, 20)
    central.writeUInt32LE(e.data.length, 24)
    central.writeUInt16LE(name.length, 28)
    central.writeUInt32LE(offset, 42)
    centrals.push(central, name)

    offset += local.length + name.length + body.length
  }
  const cd = Buffer.concat(centrals)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(entries.length, 8)
  eocd.writeUInt16LE(entries.length, 10)
  eocd.writeUInt32LE(cd.length, 12)
  eocd.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, cd, eocd])
}

/** A real workbook as SheetJS writes it, with the faculty's header in A1. */
function workbook(): Buffer {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["รหัสนักศึกษา", "ชื่อ-นามสกุล"],
      ["6604101001", "ก ข"],
    ]),
    "Sheet1",
  )
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer
}

/** The entries of a real workbook, so a case can add one part to it. */
function entriesOf(buf: Buffer): Entry[] {
  const parsed = XLSX.CFB.read(buf, { type: "buffer" })
  type Item = { f: { type: number; content: unknown }; path: string }
  const files = parsed.FileIndex as Item["f"][]
  return files
    .map((f: Item["f"], i: number): Item => ({ f, path: parsed.FullPaths[i]! }))
    .filter(({ f }: Item) => f.type === 2)
    .map(({ f, path }: Item) => ({
      name: path.replace(/^Root Entry\//, ""),
      data: Buffer.from(f.content as Uint8Array),
    }))
}

describe("inspectXlsxContainer", () => {
  it("accepts a workbook SheetJS wrote", () => {
    expect(inspectXlsxContainer(workbook())).toEqual({ ok: true })
  })

  it("accepts the same workbook rebuilt by this test's writer (the writer is sound)", () => {
    expect(inspectXlsxContainer(zip(entriesOf(workbook())))).toEqual({ ok: true })
  })

  it("refuses a macro-enabled workbook", () => {
    const withMacro = zip([
      ...entriesOf(workbook()),
      { name: "xl/vbaProject.bin", data: Buffer.from("VBA") },
    ])
    expect(inspectXlsxContainer(withMacro)).toEqual({ ok: false, problem: "macro" })
  })

  it("refuses a ZIP that is not a workbook (.ods, .xlsb, plain .zip)", () => {
    const ods = zip([{ name: "content.xml", data: Buffer.from("<office/>") }])
    const xlsb = zip([{ name: "xl/workbook.bin", data: Buffer.from([1, 2, 3]) }])
    expect(inspectXlsxContainer(ods)).toEqual({ ok: false, problem: "not-xlsx" })
    expect(inspectXlsxContainer(xlsb)).toEqual({ ok: false, problem: "not-xlsx" })
  })

  it("measures the inflated size instead of trusting the declared one (zip bomb)", () => {
    const bomb = zip([
      { name: "xl/workbook.xml", data: Buffer.from("<workbook/>") },
      { name: "xl/worksheets/sheet1.xml", data: Buffer.alloc(2 * 1024 * 1024) },
    ])
    // Tiny on disk, 2 MB inflated; a 1 MB budget must refuse it.
    expect(bomb.length).toBeLessThan(10 * 1024)
    expect(
      inspectXlsxContainer(bomb, { maxEntries: 500, maxUncompressedBytes: 1024 * 1024 }),
    ).toEqual({ ok: false, problem: "too-large" })
  })

  it("lets a stored entry count its stored size", () => {
    const stored = zip([
      { name: "xl/workbook.xml", data: Buffer.from("<workbook/>"), method: 0 },
      { name: "big.bin", data: Buffer.alloc(2048), method: 0 },
    ])
    expect(inspectXlsxContainer(stored, { maxEntries: 10, maxUncompressedBytes: 1024 })).toEqual({
      ok: false,
      problem: "too-large",
    })
  })

  it("refuses too many entries before inflating any of them", () => {
    const many = zip(
      Array.from({ length: 6 }, (_, i) => ({ name: `f${i}.xml`, data: Buffer.from("x") })),
    )
    expect(inspectXlsxContainer(many, { maxEntries: 5, maxUncompressedBytes: 1e9 })).toEqual({
      ok: false,
      problem: "too-large",
    })
  })

  it("calls a truncated or garbled archive unreadable, never throws", () => {
    const good = workbook()
    expect(inspectXlsxContainer(good.subarray(0, good.length - 30))).toEqual({
      ok: false,
      problem: "unreadable",
    })
    expect(inspectXlsxContainer(Buffer.from("PK\x03\x04 not really"))).toEqual({
      ok: false,
      problem: "unreadable",
    })
  })
})

describe("inspectXlsxContainer — archives no real .xlsx under 10 MB needs", () => {
  const workbookXml = { name: "xl/workbook.xml", data: Buffer.from("<workbook/>") }
  const unreadable = { ok: false, problem: "unreadable" }

  it("refuses an encrypted entry", () => {
    expect(inspectXlsxContainer(zip([{ ...workbookXml, flags: 0x1 }]))).toEqual(unreadable)
  })

  it("refuses a compression method other than stored or deflate", () => {
    expect(inspectXlsxContainer(zip([{ ...workbookXml, method: 12 }]))).toEqual(unreadable)
  })

  it("refuses deflate data that does not inflate", () => {
    const garbage = Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff])
    expect(inspectXlsxContainer(zip([{ ...workbookXml, raw: garbage }]))).toEqual(unreadable)
  })

  it("refuses an entry whose local header is not where the directory says", () => {
    const buf = zip([workbookXml])
    buf.writeUInt32LE(0, 0) // break the local header signature
    expect(inspectXlsxContainer(buf)).toEqual(unreadable)
  })

  it("refuses a directory entry with a bad signature", () => {
    const buf = zip([workbookXml])
    const cdOffset = buf.readUInt32LE(buf.length - 22 + 16)
    buf.writeUInt32LE(0, cdOffset)
    expect(inspectXlsxContainer(buf)).toEqual(unreadable)
  })

  it("refuses ZIP64 markers", () => {
    const buf = zip([workbookXml])
    buf.writeUInt32LE(0xffffffff, buf.length - 22 + 16) // central directory offset
    expect(inspectXlsxContainer(buf)).toEqual(unreadable)
  })

  it("refuses an entry whose data runs past the end of the file", () => {
    const buf = zip([workbookXml])
    const cdOffset = buf.readUInt32LE(buf.length - 22 + 16)
    buf.writeUInt32LE(0x7fffffff, cdOffset + 20) // compressed size
    expect(inspectXlsxContainer(buf)).toEqual(unreadable)
  })

  it("refuses a file too short to be a ZIP", () => {
    expect(inspectXlsxContainer(Buffer.from("PK"))).toEqual(unreadable)
  })
})

describe("readTable refuses what the container check refuses", () => {
  it("names macros so the instructor knows to save as .xlsx", () => {
    const withMacro = zip([
      ...entriesOf(workbook()),
      { name: "xl/vbaProject.bin", data: Buffer.from("VBA") },
    ])
    expect(() => readTable(withMacro)).toThrow("ไฟล์มีมาโคร")
  })

  it("still reads a plain workbook", () => {
    expect(readTable(workbook()).rows).toHaveLength(1)
  })
})
