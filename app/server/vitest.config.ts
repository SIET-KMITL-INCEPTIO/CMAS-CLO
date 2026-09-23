import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    name: "server",
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      // Boot/wiring files and the Prisma singleton have no logic worth covering.
      exclude: ["src/index.ts", "src/modules/index.ts", "src/db/prisma.ts", "src/**/*.test.ts"],
      thresholds: {
        // Matches docs/markdown/dev/architecture/dev.md §11.1 (services 80%, validators 90%).
        // Raise these as modules/*/ services and validators get implemented.
        lines: 60,
        functions: 60,
      },
    },
  },
})
