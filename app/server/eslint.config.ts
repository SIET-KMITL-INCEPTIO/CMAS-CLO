import js from "@eslint/js"
import tseslint from "typescript-eslint"

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    rules: {
      // `const { id: _id, ...rest } = row` drops a field on purpose (A-9 DTOs, copies).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  {
    ignores: ["dist/**", "coverage/**"],
  },
  // Ratchet (refactor-plan.md P5, 2026-11-22): no source file or function may grow past
  // the largest one today: lib/attainment.ts, 406 lines; a function in the same file, complexity 34.
  // Lower these as files are split, never raise them without a reason in the PR.
  // Tests are exempt: a long table of cases is fine.
  {
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    rules: {
      "max-lines": ["error", { max: 410, skipBlankLines: false, skipComments: false }],
      complexity: ["error", 34],
    },
  },
)
