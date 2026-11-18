import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

/**
 * U-1 of the UI/UX plan (docs/markdown/dev/planning/ui-ux-completion-plan.md):
 * every text colour the app uses is at least 4.5:1 against every surface it
 * sits on, in both themes (WCAG 2.2 AA, 1.4.3). The colours are read from
 * tokens.css itself, so a token edit is checked the moment it is made.
 */
const tokens = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "tokens.css"), "utf8")

/** `--name: #hex` declarations inside the first block that opens with `selector {`. */
function block(selector: string): Map<string, string> {
  const start = tokens.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`${selector} not found in tokens.css`)
  const body = tokens.slice(start, tokens.indexOf("\n}", start))
  return new Map(
    [...body.matchAll(/^\s*(--[\w-]+):\s*(#[0-9a-fA-F]{6})\b/gm)].map((m) => [m[1]!, m[2]!]),
  )
}

const light = new Map([...block("@theme"), ...block(":root")])
const dark = block(':root[data-theme="dark"]')

/** A token's hex in a theme: the plain variable or its Tailwind --color-* copy. */
function hex(name: string, theme: "light" | "dark"): string {
  for (const key of [`--${name}`, `--color-${name}`]) {
    if (theme === "dark" && dark.has(key)) return dark.get(key)!
  }
  for (const key of [`--${name}`, `--color-${name}`]) {
    if (light.has(key)) return light.get(key)!
  }
  throw new Error(`token ${name} has no value in the ${theme} theme`)
}

function luminance(color: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(color.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

/**
 * Text tokens (Tailwind text-* and CSS color:) and the surfaces they are drawn
 * on. `faint` is decoration only (lines, icons) since P1, so it is not here;
 * theme.test.ts fails if it is used for text again.
 */
const TEXT = ["ink", "ink2", "ink-soft", "dim", "ok", "warn", "bad", "info", "danger"]
const SURFACES = ["card", "wash", "pane", "pane-list"]
/** Text on its own filled background: status badges, buttons, chips. */
const BADGES: [string, string][] = [
  ["ok", "okBg"],
  ["warn", "warnBg"],
  ["bad", "badBg"],
  ["info", "infoBg"],
  ["on-primary", "primary"],
  ["on-primary", "primary-hover"],
  ["on-primary", "sel"],
  ["on-danger", "danger"],
  ["on-danger", "danger-hover"],
  ["chip-ink", "chip"],
]

type Pair = { theme: "light" | "dark"; fg: string; bg: string }
const PAIRS: Pair[] = (["light", "dark"] as const).flatMap((theme) => [
  ...TEXT.flatMap((fg) => SURFACES.map((bg) => ({ theme, fg, bg }))),
  ...BADGES.map(([fg, bg]) => ({ theme, fg, bg })),
])
const label = (p: Pair) => `${p.theme} ${p.fg} on ${p.bg}`

/**
 * Pairs below 4.5:1. P0 (2026-11-18) recorded 16; P1 fixed the tokens and
 * emptied the list. A pair that drops below 4.5:1 now fails the build.
 */
const KNOWN_FAILURES: string[] = []

describe("text contrast (U-1, WCAG 2.2 AA 1.4.3)", () => {
  const failing = PAIRS.filter((p) => contrast(hex(p.fg, p.theme), hex(p.bg, p.theme)) < 4.5)

  it("every text token reaches 4.5:1 on every surface, except the recorded baseline", () => {
    expect(failing.map(label).sort()).toEqual([...KNOWN_FAILURES].sort())
  })

  it("measures what WCAG measures", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5)
    expect(contrast("#767676", "#ffffff")).toBeGreaterThanOrEqual(4.5)
    expect(contrast("#777777", "#ffffff")).toBeLessThan(4.5)
  })
})
