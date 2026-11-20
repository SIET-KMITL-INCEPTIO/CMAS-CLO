import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { ADDIN_FILE, ADDIN_RELEASE } from "./addin-release.js"

const INFO = new URL("../../../../excel-addin/src/modCmasInfo.bas", import.meta.url)

describe("ADDIN_RELEASE", () => {
  it("names the version the add-in's source says it is (FR-75)", () => {
    // If these differ, every instructor is told a "new version" exists forever.
    const m = /CMAS_ADDIN_VERSION As String = "([^"]+)"/.exec(readFileSync(INFO, "ascii"))
    expect(m?.[1]).toBe(ADDIN_RELEASE.version)
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
