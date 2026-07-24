#!/usr/bin/env node
/**
 * One-command project setup:  npm run setup
 *
 * Replaces the manual checklist in README/dev.md §2.2. It is idempotent — it
 * never overwrites an existing .env — and it generates a real JWT_SECRET so
 * nobody has to invent a 32-character string by hand (the #1 reason the server
 * refuses to boot on a fresh clone).
 *
 * Zero dependencies: runs on a bare Node 20 before `npm install` has finished.
 */
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "node:fs"
import { randomBytes } from "node:crypto"
import { execSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
}
const ok = (m) => console.log(`  ${c.green}✓${c.reset} ${m}`)
const warn = (m) => console.log(`  ${c.yellow}!${c.reset} ${m}`)
const fail = (m) => console.log(`  ${c.red}✗${c.reset} ${m}`)
const step = (m) => console.log(`\n${c.bold}${m}${c.reset}`)

let hasWarnings = false

// --- 1. Prerequisites ------------------------------------------------------
step("1. Checking prerequisites")

const major = Number(process.versions.node.split(".")[0])
if (major < 20) {
  fail(`Node ${process.versions.node} — this project requires Node 20 or newer.`)
  console.log(`\n  Install Node 20 LTS, then re-run. See .nvmrc.\n`)
  process.exit(1)
}
ok(`Node ${process.versions.node}`)

try {
  const npmVersion = execSync("npm --version", { encoding: "utf8" }).trim()
  ok(`npm ${npmVersion}`)
} catch {
  fail("npm not found on PATH.")
  process.exit(1)
}

// --- 2. Environment files --------------------------------------------------
step("2. Creating environment files")

const envTargets = [
  { example: "database/.env.example", target: "database/.env" },
  { example: "app/server/.env.example", target: "app/server/.env" },
  { example: "app/client/.env.example", target: "app/client/.env" },
]

for (const { example, target } of envTargets) {
  const examplePath = path.join(root, example)
  const targetPath = path.join(root, target)

  if (!existsSync(examplePath)) {
    fail(`${example} is missing — cannot create ${target}`)
    hasWarnings = true
    continue
  }
  if (existsSync(targetPath)) {
    ok(`${target} already exists — left untouched`)
    continue
  }
  copyFileSync(examplePath, targetPath)
  ok(`created ${target}`)
}

// --- 3. JWT secret ---------------------------------------------------------
step("3. Generating JWT secret")

const serverEnvPath = path.join(root, "app/server/.env")
if (existsSync(serverEnvPath)) {
  let contents = readFileSync(serverEnvPath, "utf8")
  const match = contents.match(/^JWT_SECRET\s*=\s*"?([^"\r\n]*)"?/m)
  const current = match?.[1] ?? ""
  const isPlaceholder = current.startsWith("[") || current.length < 32

  if (isPlaceholder) {
    const secret = randomBytes(48).toString("base64url") // 64 chars, > 32 minimum
    contents = match
      ? contents.replace(/^JWT_SECRET\s*=.*$/m, `JWT_SECRET="${secret}"`)
      : `${contents.trimEnd()}\nJWT_SECRET="${secret}"\n`
    writeFileSync(serverEnvPath, contents)
    ok("generated a 64-character JWT_SECRET")
  } else {
    ok("JWT_SECRET already set — left untouched")
  }
}

// --- 4. Database URL check -------------------------------------------------
step("4. Checking database connection string")

const placeholderPattern = /\[password\]|\[ref\]/
let needsDbUrl = false
for (const target of ["database/.env", "app/server/.env"]) {
  const p = path.join(root, target)
  if (!existsSync(p)) continue
  if (placeholderPattern.test(readFileSync(p, "utf8"))) {
    warn(`${target} still contains Supabase placeholders`)
    needsDbUrl = true
    hasWarnings = true
  } else {
    ok(`${target} has a real DATABASE_URL`)
  }
}

// --- 5. Dependencies -------------------------------------------------------
step("5. Installing dependencies")

if (existsSync(path.join(root, "node_modules"))) {
  ok("node_modules present — skipping install (run `npm install` to refresh)")
} else {
  console.log(`  ${c.dim}running npm install…${c.reset}`)
  try {
    execSync("npm install", { cwd: root, stdio: "inherit" })
    ok("dependencies installed")
  } catch {
    fail("npm install failed — see output above")
    process.exit(1)
  }
}

// --- 6. Prisma client ------------------------------------------------------
step("6. Generating Prisma client")

try {
  execSync("npm run db:generate", { cwd: root, stdio: "pipe" })
  ok("Prisma client generated")
} catch {
  warn("prisma generate failed — usually means DATABASE_URL is not set yet")
  hasWarnings = true
}

// --- Done ------------------------------------------------------------------
console.log(
  `\n${c.bold}${hasWarnings ? "Setup finished with warnings" : "Setup complete"}${c.reset}`,
)

if (needsDbUrl) {
  console.log(`
${c.yellow}Before the server can boot${c.reset}, put a real Supabase connection string in:
    ${c.cyan}database/.env${c.reset}      DATABASE_URL, DIRECT_URL
    ${c.cyan}app/server/.env${c.reset}    DATABASE_URL, DIRECT_URL

  Supabase dashboard → Project Settings → Database → Connection string → URI`)
}

console.log(`
${c.bold}Next steps${c.reset}
    ${c.cyan}npm run db:migrate:dev${c.reset}   apply the schema to your database
    ${c.cyan}npm run db:seed${c.reset}          load sample courses, CLOs and scores
    ${c.cyan}npm run dev${c.reset}              client :5173 + server :3001
    ${c.cyan}npm run verify${c.reset}           format + lint + typecheck + test + build

  Docker alternative:  ${c.cyan}npm run docker:up${c.reset}
`)
