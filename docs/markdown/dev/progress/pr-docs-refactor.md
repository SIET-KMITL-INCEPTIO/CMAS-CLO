# docs: refactor docs/ (links, link checker, to-be diagrams, stale facts, single theme)

Base: `develop` ← `docs/refactor-docs` (8 commits, 73 files, +5,029 / −15,433)

## Summary

Cleans up `docs/` so it matches the current code and a single design direction.

- **Broken links fixed, and a checker keeps them fixed.** New `scripts/check-doc-links.py` (`npm run docs:links`) scans tracked `.md` for broken relative links, skipping code fences and inline code. It runs as a step in the CI `static` job.
- **Diagrams context.** New `docs/diagrams/CLAUDE.md`: diagrams show the finished (to-be) system, drawn from `index-q.html`, with status text kept out of the diagram. It also says who generates which file.
- **Duplicates and superseded files removed.** `docs/diagrams/usecase/UML.md`, two Layer-2 files, `SDIC.png`, `project-steps-flowchart.png`, the old flowchart `.drawio`, `docs/word/*.docx`, and `archive/design-system-preview.html`. `check-diagrams.py` guards against the deleted files.
- **Stale facts refreshed.** Stack versions (Node 24 LTS, React 19, Vite 7, Tailwind v4, Fastify 5, Zod 4, Prisma 6.19.3; 13 models, migrations 0001–0007) in `dev.md` (v2.2.0), `tech-stack.md`, `system-documentation-2members.md`, `CLAUDE.md`, `VERSIONS.md`, and the docs READMEs.
- **Design system docs.** `design-system.md` now states that tokens are still Verdure and that the move to Nocturnal Atelier was decided on 2026-10-18. Interaction sections moved into the new `design-system-interaction.md`. Radius values were aligned to `tokens.css`.
- **One theme for every HTML file.** All generated and hand-written HTML uses the Nocturnal Atelier light theme only. `build-index-q-design-system.py` no longer emits dark mode, and the archived `cs101-clo-tracking.html` is re-themed.
- **Path rename `docs/pages` → `docs/index-q`** applied across 47 files, including the `capabilities.test.ts` path to the prototype.
- **Prettier.** `app/client/index.html` and `README.md` were failing `format:check`; whitespace-only fix.

## Not in this PR

- `docs/index-q/reports/database-preview.html` is missing `EmailVerificationToken` (`check-schema-pages.py` reports 12/13 models). It is not run in CI.
- `docs/diagrams/architecture/CMAS-Architecture_Handwritten*.drawio` still describes the code at `ff6ed7c`; redraw as to-be or label as-is.
- `.xlsx` workbooks still contain the old `docs/pages` text until regenerated.
- Open decisions: which of progress-report-02 / -02-qa was submitted; whether to split `dev.md`, `api-design.md`, `dfd.md`, `material.md`.

## Risks

- Anyone with a branch touching files under `docs/pages/` will conflict after merge (rename).
- `docs/word/*.docx` are deleted here; history stays in git.
- Only `capabilities.test.ts` reads from `docs/`; app code is otherwise untouched.

## Test plan

- [x] `npm run verify` (format:check, lint, typecheck, test, build) passes locally: server 142 passed / 5 skipped (the skipped file is the DB isolation test), client tests pass, builds succeed
- [x] `npm run docs:links` passes
- [x] `npm run docs:build` succeeds
- [x] Branch is up to date with `origin/develop` (0 behind)
- [ ] `CI gate` green
- [ ] One approval; merge with a **merge commit** (no squash/rebase)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
