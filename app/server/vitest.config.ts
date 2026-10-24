import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    name: "server",
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup-env.ts"],
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
