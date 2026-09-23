# CMAS — Course Monitoring and Assessment System (CLO System)

Tracks Course Learning Outcomes at course level: define CLOs, map them to assessment
activities, import scores from Excel, show attainment and at-risk students. A student team
project, and the documentation doubles as thesis material.

This file is the entry point, not a duplicate. Details live in:

- `README.md`: setup, commands, structure
- `docs/README.md`: how docs are organized (Thai). `docs/markdown/` is the source; `docs/html/` is generated
- `docs/markdown/dev/dev.md`: architecture, structure (§3), naming (§4), patterns
- `docs/markdown/rule/code-rule.md`: layer rules (Route → Controller → Service → Repository)
- `docs/markdown/dev/srs.md`: requirements (FR-xx / NFR-xx IDs cited in code comments)
- `app/client/src/features/README.md`, `app/server/src/modules/README.md`: per-feature file contract

**Source of truth is the current code.** When a doc disagrees with the code, trust the code
and fix the doc in the same change.

---

## Stack

|         |                                                                                                                                                                         |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client  | React 19, TypeScript, Vite 7, Tailwind v4, React Router 7 (explicit route table in `pages.config.ts`), TanStack Query, Zustand (auth only), shadcn/ui, recharts, sonner |
| Server  | Fastify 5, TypeScript (NodeNext ESM: imports end in `.js`), Zod 4, jose (JWT), argon2                                                                                   |
| DB      | PostgreSQL (Supabase) via Prisma 6. Schema: `database/schema.prisma`                                                                                                    |
| Tooling | npm workspaces (`app/client`, `app/server`), Vitest, ESLint, Prettier                                                                                                   |

Ports: client `5173`, server `3001`. Launch configs are in `.claude/launch.json`.

## Layout

```
app/client/src/features/<name>/   Page.page.tsx · Component.tsx · useXxx.ts · xxx.api.ts · xxx.types.ts
app/server/src/modules/<name>/    xxx.route.ts · xxx.controller.ts · xxx.service.ts · model.repository.ts · xxx.validator.ts
database/                         schema.prisma · migrations/ · seed.ts
docs/                             markdown/ (source) · pages/ (hand-written HTML) · reference/ · uml/ · excel/ word/ pdf/
scripts/                          setup.mjs · build-*.py (diagram/workbook generators) · check-*.{py,js}
```

- **Same feature name on both sides.** `features/clos/` ↔ `modules/clos/`.
- A file moves to shared `components/`, `hooks/`, `lib/`, `types/` only when a second feature uses it.
- Server files are `kebab-case.<layer>.ts`. Client files follow React casing (`PascalCase.tsx`, `useX.ts`, `camelCase.api.ts`).
- Tests sit next to the file they cover (`x.test.ts`).

## Rules that matter

1. **Course scope is the only data boundary** (single-tenant since 2026-08-04). Every route with a
   `:courseId` must call `assertCourseAccess()` from `modules/authorization/authorization.service.ts`.
   Return **404, never 403**, for a course the caller can't see: a 403 confirms the id exists.
2. **`authMiddleware` re-reads the live User row.** Don't "optimize" it into trusting the JWT role claim.
3. **Services don't call `prisma` directly**; they go through a repository (code-rule §3).
   `authorization.service.ts` predates that rule and still does.
4. **Never rename or hand-edit a folder in `database/migrations/`.** Prisma records the names in
   the database. `0002_constraints_and_triggers` is hand-written SQL (CHECKs and triggers).
   `prisma db push` silently drops it; always use `migrate`.
5. **Never edit `docs/html/`.** `npm run docs:build` deletes and regenerates it.
6. **`python scripts/check-diagrams.py` re-runs the generator scripts** and compares output (step
   UML-4). It may rewrite tracked `.drawio` files, so check `git status` after running it. It
   currently exits 1 on known presentation warnings.
7. TypeScript strict, no `any`. Validate all input with Zod on the server. Excel uploads are
   validated row by row server-side.

## Commands

```bash
npm run setup            # idempotent: .env files, JWT secret, install, prisma generate
npm run dev              # client + server
npm run verify           # format:check + lint + typecheck + test + build (run before push)
npm run db:migrate:dev   # create + apply migration (pass --name snake_case_verb_noun)
npm run db:seed
npm run docs:build       # docs/markdown → docs/html
```
