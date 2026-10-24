import { defineConfig, devices } from "@playwright/test"

/**
 * E2E smoke against the PRODUCTION build: `app/server/dist` under
 * NODE_ENV=production and `app/client/dist` through `vite preview`, on a
 * migrated + seeded Postgres. Run `npm run build` first.
 *
 * Needs DATABASE_URL (a throwaway database: the tests write to it), JWT_SECRET
 * (any 32+ chars; the tests sign tokens with it), GOOGLE_CLIENT_ID (any
 * value; Google is never called). CI sets all three in the e2e job.
 *
 * Plan: docs/markdown/dev/planning/ci-cd-plan.md §5.5
 */
const SERVER = "http://localhost:3001"
const CLIENT = "http://localhost:5173"
const CI = Boolean(process.env.CI)

const inherited = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
)

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  forbidOnly: CI,
  // A smoke test that needs a retry to pass is a bug, not a pass (plan §5.3).
  retries: 0,
  // The tests share one database and one seeded admin.
  workers: 1,
  reporter: CI
    ? [["github"], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : "list",
  use: {
    baseURL: CLIENT,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node app/server/dist/index.js",
      cwd: "..",
      url: `${SERVER}/api/v1/health`,
      env: { ...inherited, NODE_ENV: "production", PORT: "3001" },
      reuseExistingServer: !CI,
      timeout: 60_000,
    },
    {
      command: "npm run preview -w app/client -- --port 5173 --strictPort",
      cwd: "..",
      url: CLIENT,
      reuseExistingServer: !CI,
      timeout: 60_000,
    },
  ],
})
