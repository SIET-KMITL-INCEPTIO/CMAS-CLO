import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { ADDIN_RELEASE } from "./addin-release.js"

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
})
