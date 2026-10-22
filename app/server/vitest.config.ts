import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    name: "server",
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup-env.ts"],
    // The *.db.test.ts files talk to a remote Supabase database: one request is
    // several round trips of 0.2–1 s, so 5 s is too tight for a multi-request case.
    testTimeout: process.env.CMAS_DB_TESTS === "1" ? 30_000 : 5_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      // Boot/wiring files and the Prisma singleton have no logic worth covering.
      exclude: [
        "src/index.ts",
        "src/modules/index.ts",
        "src/db/prisma.ts",
        "src/test/**",
        "src/**/*.test.ts",
      ],
      thresholds: {
        // Matches docs/markdown/dev/architecture/dev.md §11.1 (services 80%, validators 90%).
        // Raise these as modules/*/ services and validators get implemented.
        lines: 60,
        functions: 60,
      },
    },
  },
})
