import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

/** The dark theme must re-point every surface colour, or a light panel shows behind dark cards. */
const dir = dirname(fileURLToPath(import.meta.url))
const tokens = readFileSync(join(dir, "tokens.css"), "utf8")
const atelier = readFileSync(join(dir, "atelier.css"), "utf8")

/** Variable names declared in the first block that starts with `selector {`. */
function declared(selector: string): Set<string> {
  const start = tokens.indexOf(`${selector} {`)
  expect(start, `${selector} block`).toBeGreaterThanOrEqual(0)
  const body = tokens.slice(start, tokens.indexOf("\n}", start))
  return new Set([...body.matchAll(/^\s*(--[\w-]+):/gm)].map((m) => m[1]!))
}

describe("theme tokens", () => {
  const light = declared(":root")
  const dark = declared(':root[data-theme="dark"]')

  it("re-points every surface variable in the dark theme", () => {
    const surfaces = ["--pane", "--pane-list", "--pane-foot", "--th-bg", "--bad-wash"]
    for (const v of surfaces) {
      expect(light.has(v), `${v} in light`).toBe(true)
      expect(dark.has(v), `${v} in dark`).toBe(true)
    }
  })

  it("has a dark value for every plain colour variable the light theme sets", () => {
    const colour = [...light].filter((v) =>
      /^--(ink|ink2|dim|faint|edge|edge2|tint|card|wash|bg-[abc])$/.test(v),
    )
    expect(colour.filter((v) => !dark.has(v))).toEqual([])
  })
})

describe("atelier.css", () => {
  const rule = (selector: string) => {
    const start = atelier.indexOf(`\n${selector} {`)
    expect(start, selector).toBeGreaterThanOrEqual(0)
    return atelier.slice(start, atelier.indexOf("}", start))
  }

  it.each([".content", ".listpane", ".ccard-foot", "table.dt thead th"])(
    "%s takes its background from a theme variable, not a fixed colour",
    (selector) => {
      expect(rule(selector)).toMatch(/background:\s*var\(--/)
    },
  )
})
