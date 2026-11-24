import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { ADDIN_FILE, ADDIN_RELEASE, WORKBOOK_RELEASE, WORKBOOK_TEMPLATE } from "./addin-release.js"

const INFO = new URL("../../../../excel-addin/src/modCmasInfo.bas", import.meta.url)

describe("WORKBOOK_RELEASE", () => {
  it("names the version the VBA source says it is (FR-75)", () => {
    // If these differ, every instructor is told a "new version" exists forever.
    const m = /CMAS_ADDIN_VERSION As String = "([^"]+)"/.exec(readFileSync(INFO, "ascii"))
    expect(m?.[1]).toBe(WORKBOOK_RELEASE.version)
  })

  it("publishes a SHA-256 only together with the committed template it describes", () => {
    if (WORKBOOK_RELEASE.sha256 === null) return
    expect(WORKBOOK_RELEASE.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(createHash("sha256").update(readFileSync(WORKBOOK_TEMPLATE)).digest("hex")).toBe(
      WORKBOOK_RELEASE.sha256,
    )
  })
})

describe("ADDIN_RELEASE", () => {
  it("is no newer than the VBA source", () => {
    const n = (v: string) => v.split(".").map(Number)
    const [a, w] = [n(ADDIN_RELEASE.version), n(WORKBOOK_RELEASE.version)]
    expect(a[0]! * 1e6 + a[1]! * 1e3 + a[2]!).toBeLessThanOrEqual(w[0]! * 1e6 + w[1]! * 1e3 + w[2]!)
  })

  it("publishes a SHA-256 only in its proper form", () => {
    if (ADDIN_RELEASE.sha256 !== null) expect(ADDIN_RELEASE.sha256).toMatch(/^[0-9a-f]{64}$/)
  })

  it("publishes a SHA-256 only together with the committed file it describes", () => {
    // Otherwise the download page offers a button the server answers with 404.
    if (ADDIN_RELEASE.sha256 === null) return
    expect(existsSync(ADDIN_FILE)).toBe(true)
    expect(createHash("sha256").update(readFileSync(ADDIN_FILE)).digest("hex")).toBe(
      ADDIN_RELEASE.sha256,
    )
  })
})
