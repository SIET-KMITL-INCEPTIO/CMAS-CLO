// Prints a Markdown coverage table for the CI job summary.
// Reads the json-summary reporter output of both workspaces; a workspace whose
// tests did not run is listed as missing instead of failing the step.
// Usage: node scripts/coverage-summary.mjs >> "$GITHUB_STEP_SUMMARY"
import { existsSync, readFileSync } from "node:fs"

const workspaces = ["app/client", "app/server"]
const metrics = ["lines", "statements", "functions", "branches"]

const rows = workspaces.map((workspace) => {
  const file = `${workspace}/coverage/coverage-summary.json`
  if (!existsSync(file)) return `| ${workspace} | ${metrics.map(() => "—").join(" | ")} |`
  const { total } = JSON.parse(readFileSync(file, "utf8"))
  return `| ${workspace} | ${metrics.map((m) => `${total[m].pct.toFixed(1)}%`).join(" | ")} |`
})

console.log("### Coverage (unit tests)\n")
console.log(`| Workspace | ${metrics.join(" | ")} |`)
console.log(`| --- | ${metrics.map(() => "---:").join(" | ")} |`)
console.log(rows.join("\n"))
