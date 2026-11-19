/**
 * Checks the ZIP container of an uploaded .xlsx before SheetJS opens it (NFR-20).
 *
 * The 10 MB cap in app.ts bounds the compressed upload only. Deflate packs a
 * run of zeros about 1000:1, so a 10 MB file can expand into gigabytes in
 * memory (a zip bomb). Here each entry is inflated with a hard output cap, so
 * the real size is measured. The sizes the ZIP's directory declares are not
 * trusted, because a crafted file can lie about them.
 *
 * Also refused:
 *  - macro-enabled workbooks (`vbaProject.bin`): CMAS data files are macro-free
 *    by rule, so the code (the CMAS add-in) and the data (.xlsx) stay apart
 *  - anything that is a ZIP but not an .xlsx workbook (.xlsb, .ods, a plain .zip)
 *  - encrypted entries, ZIP64 and compression methods other than stored/deflate,
 *    which a real .xlsx under 10 MB never needs
 */
import { inflateRawSync } from "node:zlib"

export type ContainerLimits = {
  /** Entries in the archive. A plain workbook has about 10â€“30. */
  maxEntries: number
  /** Total bytes after inflating every entry. */
  maxUncompressedBytes: number
}

export const DEFAULT_LIMITS: ContainerLimits = {
  maxEntries: 500,
  maxUncompressedBytes: 100 * 1024 * 1024,
}

export type ContainerProblem = "unreadable" | "not-xlsx" | "macro" | "too-large"
export type ContainerCheck = { ok: true } | { ok: false; problem: ContainerProblem }

const EOCD_SIG = 0x06054b50
const CENTRAL_SIG = 0x02014b50
const LOCAL_SIG = 0x04034b50
const EOCD_MIN = 22
const MAX_COMMENT = 0xffff
const ZIP64_MARK = 0xffffffff

class Unreadable extends Error {}

function u16(buf: Buffer, at: number) {
  if (at < 0 || at + 2 > buf.length) throw new Unreadable()
  return buf.readUInt16LE(at)
}
function u32(buf: Buffer, at: number) {
  if (at < 0 || at + 4 > buf.length) throw new Unreadable()
  return buf.readUInt32LE(at)
}

function findEndOfCentralDirectory(buf: Buffer): number {
  const stop = Math.max(0, buf.length - EOCD_MIN - MAX_COMMENT)
  for (let i = buf.length - EOCD_MIN; i >= stop; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) return i
  }
  throw new Unreadable()
}

const isMacroPart = (name: string) => /(^|\/)vbaProject\.bin$/i.test(name)

export function inspectXlsxContainer(
  buf: Buffer,
  limits: ContainerLimits = DEFAULT_LIMITS,
): ContainerCheck {
  try {
    if (buf.length < EOCD_MIN) throw new Unreadable()
    const eocd = findEndOfCentralDirectory(buf)
    const entries = u16(buf, eocd + 10)
    const cdOffset = u32(buf, eocd + 16)
    if (entries === 0xffff || cdOffset === ZIP64_MARK) throw new Unreadable()
    if (entries > limits.maxEntries) return { ok: false, problem: "too-large" }

    let at = cdOffset
    let budget = limits.maxUncompressedBytes
    let hasWorkbook = false
    let hasMacro = false

    for (let n = 0; n < entries; n++) {
      if (u32(buf, at) !== CENTRAL_SIG) throw new Unreadable()
      const flags = u16(buf, at + 8)
      const method = u16(buf, at + 10)
      const compressed = u32(buf, at + 20)
      const nameLen = u16(buf, at + 28)
      const extraLen = u16(buf, at + 30)
      const commentLen = u16(buf, at + 32)
      const localOffset = u32(buf, at + 42)
      if (at + 46 + nameLen > buf.length) throw new Unreadable()
      const name = buf.toString("utf8", at + 46, at + 46 + nameLen)
      at += 46 + nameLen + extraLen + commentLen

      if (compressed === ZIP64_MARK || localOffset === ZIP64_MARK) throw new Unreadable()
      if (flags & 0x1) throw new Unreadable() // encrypted entry
      if (name === "xl/workbook.xml") hasWorkbook = true
      if (isMacroPart(name)) hasMacro = true

      // The data starts after the local header, whose name and extra lengths
      // may differ from the central directory's.
      if (u32(buf, localOffset) !== LOCAL_SIG) throw new Unreadable()
      const dataStart = localOffset + 30 + u16(buf, localOffset + 26) + u16(buf, localOffset + 28)
      const dataEnd = dataStart + compressed
      if (dataEnd > buf.length) throw new Unreadable()

      let size: number
      if (method === 0) {
        size = compressed
      } else if (method === 8) {
        try {
          // maxOutputLength makes zlib stop at the cap instead of allocating
          // whatever the stream expands to. +1 so "exactly at the cap" passes.
          size = inflateRawSync(buf.subarray(dataStart, dataEnd), {
            maxOutputLength: budget + 1,
          }).length
        } catch (err) {
          if (err instanceof RangeError) return { ok: false, problem: "too-large" }
          throw new Unreadable()
        }
      } else {
        throw new Unreadable()
      }
      budget -= size
      if (budget < 0) return { ok: false, problem: "too-large" }
    }

    if (hasMacro) return { ok: false, problem: "macro" }
    if (!hasWorkbook) return { ok: false, problem: "not-xlsx" }
    return { ok: true }
  } catch (err) {
    if (err instanceof Unreadable) return { ok: false, problem: "unreadable" }
    throw err
  }
}
