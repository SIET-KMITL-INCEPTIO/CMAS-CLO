import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react-swc"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Not import.meta.dirname — that needs Node >=20.11, but package.json engines
// allow any 20.x.
const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirrors the "@/*" alias in tsconfig.app.json so tests import the same way
    // components do.
    alias: { "@": path.resolve(rootDir, "./src") },
  },
  test: {
    name: "client",
    // happy-dom rather than jsdom: same API surface for component tests at a
    // fraction of the install and startup cost.
    environment: "happy-dom",
    globals: false,
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/vite-env.d.ts", "src/**/*.test.{ts,tsx}"],
      // Ratchet: what main measured on 2026-10-24 (one test file so far), only
      // ever raised, toward dev.md §11.1 (client hooks 70%). Enforced by the
      // CI `unit` job. Lowering one needs a reason in the PR.
      thresholds: { lines: 2, statements: 2, functions: 20, branches: 20 },
    },
  },
})
