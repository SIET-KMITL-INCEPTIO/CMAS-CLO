import js from "@eslint/js"
import tseslint from "typescript-eslint"
import react from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"

export default tseslint.config(
  // Must come first: without this ESLint walks the production bundle in dist/
  // and reports thousands of errors against minified vendor code.
  {
    ignores: ["dist/**", "coverage/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react-refresh/only-export-components": "warn",
      // TypeScript already resolves every identifier, including DOM globals.
      // Leaving no-undef on would require duplicating the whole browser global
      // list here and produces false positives on `document`, `window`, etc.
      "no-undef": "off",
    },
    settings: { react: { version: "19.0" } },
  },
  // Ratchet (refactor-plan.md P5, 2026-11-22): no source file or function may grow past
  // the largest one today: ActivityForm.tsx, 386 lines; CourseOverview.page.tsx, complexity 35.
  // Lower these as files are split, never raise them without a reason in the PR.
  // Tests are exempt: a long table of cases is fine.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "max-lines": ["error", { max: 390, skipBlankLines: false, skipComments: false }],
      complexity: ["error", 35],
    },
  },
)
