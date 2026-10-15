import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { CAPABILITIES } from "./capabilities.js"

/**
 * The prototype's PERM table is the spec. This test reads it out of
 * docs/pages/index-q.html and fails when the server table drifts from it.
 */
const html = readFileSync(
  new URL("../../../../../docs/pages/index-q.html", import.meta.url),
  "utf-8",
)

function readPerm(): Record<string, string[]> {
  const aliases: Record<string, string[]> = {}
  for (const m of html.matchAll(/^const (TEACH|NODEL)\s*=\s*(\[[^\]]*\]|TEACH);/gm)) {
    const name = m[1]!
    const value = m[2]!
    aliases[name] =
      value === "TEACH" ? aliases.TEACH! : [...value.matchAll(/'(\w+)'/g)].map((r) => r[1]!)
  }
  const block = html.slice(
    html.indexOf("const PERM = {"),
    html.indexOf("};", html.indexOf("const PERM = {")),
  )
  const perm: Record<string, string[]> = {}
  for (const m of block.matchAll(/'([a-z]+\.[a-z]+)':\s*(TEACH|NODEL|\[[^\]]*\])/g)) {
    const cap = m[1]!
    const value = m[2]!
    perm[cap] = aliases[value] ?? [...value.matchAll(/'(\w+)'/g)].map((r) => r[1]!)
  }
  return perm
}

describe("capabilities ↔ PERM in index-q.html", () => {
  const perm = readPerm()
  const server = Object.fromEntries(
    Object.entries(CAPABILITIES)
      .filter(([cap]) => cap !== "course.view") // server-only read capability
      .map(([cap, rule]) => [cap, [...rule.roles]]),
  )

  it("found the prototype's 17 capabilities", () => {
    expect(Object.keys(perm)).toHaveLength(17)
  })

  it("has the same capabilities with the same roles", () => {
    expect(server).toEqual(perm)
  })

  it("treats only course creation and account management as system-wide", () => {
    const system = Object.entries(CAPABILITIES)
      .filter(([, rule]) => rule.scope === "system")
      .map(([cap]) => cap)
      .sort()
    expect(system).toEqual(["course.create", "user.manage"])
  })
})
