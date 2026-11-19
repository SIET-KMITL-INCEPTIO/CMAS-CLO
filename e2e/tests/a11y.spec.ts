import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { AxeBuilder } from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { prisma, signInAs } from "../support/session"

/**
 * U-1, U-5 and U-6 of the UI/UX plan (docs/markdown/dev/planning/
 * ui-ux-completion-plan.md): every page, in both themes, at a phone and a
 * laptop width, has no serious or critical axe violation (WCAG 2.2 A/AA) and
 * does not scroll sideways.
 *
 * What fails today is recorded in a11y-baseline.json, one key per
 * page × theme × width. The test fails when a page gains a violation that is
 * not in the file, AND when a recorded one is gone — so the file can only
 * shrink, and every fix has to delete its line. Rebuild the file with
 * UPDATE_A11Y_BASELINE=1 npm run test:e2e -- a11y.
 */

// __dirname, not import.meta: Playwright loads the e2e specs as CommonJS.
const BASELINE_FILE = join(__dirname, "..", "a11y-baseline.json")
const FOUND_DIR = join(__dirname, "..", "test-results")
const UPDATE = process.env.UPDATE_A11Y_BASELINE === "1"
const baseline: Record<string, string[]> = JSON.parse(readFileSync(BASELINE_FILE, "utf8"))
const found: Record<string, string[]> = {}

const ADMIN = "admin@cmas.local"
const INSTRUCTOR = "instructor1@cmas.local" // teaches the seeded course 90641001

type Target = { name: string; path: (courseId: string) => string; as: string | null }
const PAGES: Target[] = [
  { name: "login", path: () => "/auth/login", as: null },
  { name: "home", path: () => "/", as: INSTRUCTOR },
  { name: "courses", path: () => "/courses", as: INSTRUCTOR },
  { name: "users", path: () => "/admin/users", as: ADMIN },
  { name: "overview", path: (c) => `/courses/${c}`, as: INSTRUCTOR },
  { name: "clos", path: (c) => `/courses/${c}/clos`, as: INSTRUCTOR },
  { name: "objectives", path: (c) => `/courses/${c}/objectives`, as: INSTRUCTOR },
  { name: "activities", path: (c) => `/courses/${c}/activities`, as: INSTRUCTOR },
  { name: "roster", path: (c) => `/courses/${c}/roster`, as: INSTRUCTOR },
  { name: "results", path: (c) => `/courses/${c}/results`, as: INSTRUCTOR },
  { name: "grading", path: (c) => `/courses/${c}/grading`, as: INSTRUCTOR },
]
const RUNS = [
  { theme: "light", width: 1280 },
  { theme: "dark", width: 1280 },
  { theme: "light", width: 375 },
] as const

let courseId = ""

test.beforeAll(async () => {
  const course = await prisma.course.findFirstOrThrow({
    where: { code: "90641001", instructors: { some: { user: { email: INSTRUCTOR } } } },
    select: { id: true },
  })
  courseId = course.id
})

test.afterAll(async () => {
  const sorted = Object.fromEntries(Object.entries(found).sort(([a], [b]) => a.localeCompare(b)))
  const json = `${JSON.stringify(sorted, null, 2)}\n`
  // Always kept with the run (CI uploads test-results on failure), so a
  // baseline can be read from a CI run when no local Postgres is at hand.
  mkdirSync(FOUND_DIR, { recursive: true })
  writeFileSync(join(FOUND_DIR, "a11y-found.json"), json)
  if (UPDATE) writeFileSync(BASELINE_FILE, json)
  await prisma.$disconnect()
})

/** The theme the reader picked in Settings (display.ts keeps it in localStorage). */
async function useTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((t) => {
    localStorage.setItem("cmas-display", JSON.stringify({ theme: t }))
  }, theme)
}

for (const target of PAGES) {
  for (const run of RUNS) {
    const key = `${target.name} ${run.theme} ${run.width}`

    test(`${key} has no serious accessibility problem`, async ({ page }) => {
      await page.setViewportSize({ width: run.width, height: 900 })
      await useTheme(page, run.theme)
      if (target.as) await signInAs(page, target.as)

      await page.goto(target.path(courseId))
      // Not "networkidle": the app holds /events open (live updates), so the
      // network never goes idle. Every page shows "กำลังโหลด…" until its data is in.
      await expect(page.getByText("กำลังโหลด")).toHaveCount(0, { timeout: 15_000 })
      await expect(page.locator("html")).toHaveAttribute("data-theme", run.theme)

      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze()
      const problems = axe.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => v.id)

      const sideways = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      )
      if (sideways) problems.push("page-scrolls-sideways")

      found[key] = [...new Set(problems)].sort()
      if (found[key].length === 0) delete found[key]
      if (UPDATE) return

      expect(found[key] ?? [], `${key}: compare with e2e/a11y-baseline.json`).toEqual(
        baseline[key] ?? [],
      )
    })
  }
}
