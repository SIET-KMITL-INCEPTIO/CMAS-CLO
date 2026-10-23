import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    name: "server",
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup-env.ts"],
    // The *.db.test.ts files talk to a remote Supabase database: one request is
    // several round trips of 0.2–1 s, so 5 s is too tight for a multi-request case.
    // The *.db.test.ts files share one database and each clears the @cmas.test
    // accounts it made — in parallel they delete each other's users (401/404).
    fileParallelism: process.env.CMAS_DB_TESTS !== "1",
    testTimeout: process.env.CMAS_DB_TESTS === "1" ? 30_000 : 5_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.ts"],
      // Boot/wiring files and the Prisma singleton have no logic worth covering.
      exclude: [
        "src/index.ts",
        "src/modules/index.ts",
        "src/db/prisma.ts",
        "src/test/**",
        "src/**/*.test.ts",
      ],
      // Enforced by the CI `unit` job (npm run test:unit), which runs WITHOUT the
      // *.db.test.ts / isolation files, so these are unit-only numbers.
      // Ratchet: set to what main measured on 2026-10-24 and only ever raised,
      // toward dev.md §11.1 (computation 90% · services 80% · validators 90%).
      // Lowering one needs a reason in the PR (ci-cd-plan.md §5.3).
      thresholds: {
        lines: 74,
        statements: 74,
        functions: 70,
        branches: 87,
        // jwt, env, response, errors; attainment and weights join when they land.
        "src/lib/**": { lines: 83, statements: 83, functions: 86, branches: 100 },
      },
    },
  },
})
