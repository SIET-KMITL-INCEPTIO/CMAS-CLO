# CLO System (CMAS)

Course Monitoring and Assessment System — tracks and evaluates **Course
Learning Outcomes** at course level: define CLOs, map them to assessment
activities, import scores from Excel, and surface attainment and at-risk
students on a dashboard.

React 19 SPA · Fastify 5 API · Prisma 6 · PostgreSQL (Supabase)

---

## Quick start

```bash
git clone https://github.com/SIET-KMITL-INCEPTIO/CMAS-CLO.git
cd CMAS-CLO
npm run setup
```

`npm run setup` checks your Node version, creates all three `.env` files from
their examples, **generates a valid `JWT_SECRET`**, installs dependencies, and
generates the Prisma client. It is safe to re-run — it never overwrites an
existing `.env`.

Then fill in the `.env` files and go:

```bash
# database/.env + app/server/.env:  DATABASE_URL / DIRECT_URL (Supabase)
# app/server/.env:                  GOOGLE_CLIENT_ID, ADMIN_EMAILS=you@example.com
# app/client/.env:                  VITE_GOOGLE_CLIENT_ID (same OAuth client)
npm run db:migrate:dev    # apply the schema
npm run db:seed           # sample course, CLOs, students and scores
npm run dev               # client :5173 + server :3001
```

Sign-in is **Google only**. An email listed in `ADMIN_EMAILS` becomes ADMIN on
its first Google sign-in (FR-05a); that is how the first admin is made. Emails
on `INSTITUTION_EMAIL_DOMAIN` are approved as INSTRUCTOR automatically, and
everyone else waits for an admin to approve them under **Users**.

### With Docker instead

```bash
npm run docker:up
```

Runs client and server in containers against the same Supabase database. No
local Node install required — see [dev.md §2.2b](docs/markdown/dev/architecture/dev.md).

---

## Requirements

|          |                                                               |
| -------- | ------------------------------------------------------------- |
| Node.js  | 24 LTS or newer (see `.nvmrc`)                                |
| npm      | 10+ — this repo uses **npm workspaces**, not pnpm             |
| Database | A PostgreSQL 15+ connection string (Supabase in dev and prod) |
| Docker   | Optional — only for the containerised workflow                |

---

## Structure

```
CMAS/
├── app/
│   ├── client/          React 19 + React Router 7 (SPA) → Vercel
│   │   └── src/
│   │       ├── features/    one folder per feature: pages, components, hooks, api
│   │       ├── components/  shared UI only (ui/ = shadcn, layout/)
│   │       ├── hooks/       shared hooks only
│   │       ├── lib/         apiClient (JWT header, error toasts), constants, cn()
│   │       ├── styles/      design tokens + base CSS
│   │       └── types/       shared DTOs
│   └── server/          Fastify 5 + TypeScript → Railway / Fly.io
│       └── src/
│           ├── modules/      one folder per feature: route → controller → service → repository
│           ├── middlewares/  auth, RBAC, error handler
│           ├── db/           the single PrismaClient
│           └── lib/          env, jwt, response helpers
├── database/            schema.prisma (source of truth), migrations/, seed.ts
├── e2e/                 Playwright smoke against the production build
├── scripts/             setup.mjs + diagram / workbook generators and checkers
└── docs/                standards, diagrams, SQL reference — see docs/README.md
```

Each app deploys independently. They share nothing but the API contract and
`database/schema.prisma`. A feature has the **same folder name on both sides**
(`features/clos/` ↔ `modules/clos/`), so one search finds every layer. Read
[features/README.md](app/client/src/features/README.md) and
[modules/README.md](app/server/src/modules/README.md) before adding files.

---

## Commands

| Command                             | Does                                                           |
| ----------------------------------- | -------------------------------------------------------------- |
| `npm run setup`                     | One-time project setup (idempotent)                            |
| `npm run dev`                       | Client + server together                                       |
| `npm run dev:client` / `dev:server` | One side only                                                  |
| `npm run build`                     | Build both apps                                                |
| `npm test`                          | Run all tests (Vitest)                                         |
| `npm run test:coverage`             | Tests with coverage report                                     |
| `npm run test:unit`                 | Unit tests with enforced coverage (CI `unit` job)              |
| `npm run test:e2e`                  | Playwright smoke; `npm run build` first, disposable DB         |
| `npm run lint` / `lint:fix`         | ESLint across both workspaces                                  |
| `npm run typecheck`                 | TypeScript, including test files                               |
| `npm run format` / `format:check`   | Prettier (code only — `docs/` is excluded)                     |
| **`npm run verify`**                | **format + lint + typecheck + test + build — run before push** |
| `npm run clean`                     | Remove build output and coverage                               |

### Database

| Command                             | Does                                                         |
| ----------------------------------- | ------------------------------------------------------------ |
| `npm run db:generate`               | Regenerate Prisma client (after schema edits)                |
| `npm run db:migrate:dev`            | Create + apply a migration                                   |
| `npm run db:migrate:deploy`         | Apply migrations in production                               |
| `npm run db:seed`                   | Load sample data (refuses to run with `NODE_ENV=production`) |
| `npm run db:studio`                 | Prisma Studio GUI on :5555                                   |
| `npm run db:format` / `db:validate` | Format / validate `schema.prisma`                            |

### Docker

| Command                | Does                             |
| ---------------------- | -------------------------------- |
| `npm run docker:up`    | Start client + server containers |
| `npm run docker:build` | Rebuild images and start         |
| `npm run docker:down`  | Stop containers                  |

---

## Deploy

| App          | Target           | Root directory | Image                        |
| ------------ | ---------------- | -------------- | ---------------------------- |
| `app/client` | Vercel           | `app/client`   | — (static build)             |
| `app/server` | Railway / Fly.io | `app/server`   | `app/server/Dockerfile.prod` |
| Database     | Supabase         | —              | —                            |

Set each platform's build "root directory" to the relevant `app/*` folder so it
installs only that workspace and the two apps can ship on independent
schedules. `docker-compose.prod.yml` runs the production images locally if you
want to check an image before pushing it.

CI runs on every PR to `main`: `.github/workflows/ci.yml` runs the full `verify`
pipeline and the migration/isolation suite, and
`.github/workflows/docker-build.yml` builds all four Dockerfiles (one check per
image, e.g. "Docker build (server)").

---

## Documentation

| Document                                                                                                                                                  | Contents                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [dev.md](docs/markdown/dev/architecture/dev.md)                                                                                                           | Tech stack, setup, conventions, API standards, review checklist |
| [features-pages.md](docs/markdown/dev/architecture/features-pages.md)                                                                                     | Feature and page scope — the scope source of truth              |
| [tech-stack.md](docs/markdown/graph/tech-stack.md)                                                                                                        | Architecture diagram                                            |
| [schema.md](docs/markdown/sql/schema.md)                                                                                                                  | Schema summary — `database/schema.prisma` wins on conflict      |
| [design-system.md](docs/markdown/dev/architecture/design-system.md)                                                                                       | Design tokens and components                                    |
| [code-rule.md](docs/markdown/rule/code-rule.md) · [git-rule.md](docs/markdown/rule/git-rule.md) · [security-rule.md](docs/markdown/rule/security-rule.md) | Team rules                                                      |

Rebuild the browsable HTML docs with `npm run docs:build`.

---

## Project status

Early development. The database schema and the client/server skeletons are in
place; most API endpoints and pages are not implemented yet.

- **Working** (all under `/api/v1`): `GET /health`, `POST /auth/google` (with `ADMIN_EMAILS` admin bootstrap, FR-05a), `GET /users`, `PATCH /users/:id/approve` (FR-08b), and the Home / Login / Users / CourseList pages
- **Not implemented:** everything course-level — CLOs, objectives, activities, criteria, roster, scores, Excel import, dashboard, grading
- **Database:** 13 Prisma models, migrations `0001`–`0007` (`0002`–`0007` hand-written, not yet replayed against a shadow DB)
- **Scope:** 14 features / 14 pages — see [features-pages.md](docs/markdown/dev/architecture/features-pages.md)

### Two tracks: the app (CMAS) and the prototype (`index-q.html`)

|              | **CMAS** (`app/`, `database/`)                            | **`docs/pages/index-q.html`**                                                                                                                                                                                                           |
| ------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What         | The real system: React + Fastify + Postgres               | A single-file UI prototype (~9,500 lines, Tailwind CDN + SheetJS, data in an in-page `db` object) — opens from `file://`                                                                                                                |
| Covers       | Google sign-in, user approval, course list (heading only) | Every course-level flow, permission matrix `PERM`, all formulas (CR-01…CR-11), grading, Excel import/export                                                                                                                             |
| Role         | What ships                                                | The behavioural spec the app is built against — it is **ahead of** the app and of `schema.prisma`                                                                                                                                       |
| Derived docs | `docs/markdown/**`, `database/schema.prisma`              | `docs/diagrams/*` (use case · ER · DFD), `docs/reference/db/mysql/index-q.sql`, `index-q-ux-pass.md`, `mockup-feedback-plan.md`, `scripts/build-*index-q*.py`, `check-perm-matrix.js` · `check-action-caps.js` · `check-auth-events.js` |

**What to take from which:** features, flows and UI from the prototype; security, performance and tech stack from the app;
and the prototype habits that must not be copied (client-side `can()`, in-browser formulas and Excel parsing) — see
[`docs/markdown/dev/architecture/prototype-to-app.md`](docs/markdown/dev/architecture/prototype-to-app.md).

`index-q.sql` = Prisma through migration `0007` **plus** what the prototype proposes and Prisma lacks (`AuthEvent`, `UploadReject`,
`CourseGroupWeight`, `Course.weightMode`, `Activity.passScore`, password-flow columns on `User`, `ScoreUploadLog.kind`) — those are candidates
for a future migration `0008`, not requirements yet.
