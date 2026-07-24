# CLO System (CMAS)

Course Monitoring and Assessment System — tracks and evaluates **Course
Learning Outcomes** at course level: define CLOs, map them to assessment
activities, import scores from Excel, and surface attainment and at-risk
students on a dashboard.

React 19 SPA · Fastify 5 API · Prisma 6 · PostgreSQL (Supabase)

---

## Quick start

```bash
git clone https://github.com/<org>/clo-system.git
cd CMAS
npm run setup
```

`npm run setup` checks your Node version, creates all three `.env` files from
their examples, **generates a valid `JWT_SECRET`**, installs dependencies, and
generates the Prisma client. It is safe to re-run — it never overwrites an
existing `.env`.

Then point it at a database and go:

```bash
# paste your Supabase connection string into database/.env and app/server/.env
npm run db:migrate:dev    # apply the schema
npm run db:seed           # sample course, CLOs, students and scores
npm run dev               # client :5173 + server :3001
```

Sign in with `admin@cmas.local` / `ChangeMe!2026` (override with
`SEED_PASSWORD=… npm run db:seed`).

### With Docker instead

```bash
npm run docker:up
```

Runs client and server in containers against the same Supabase database. No
local Node install required — see [dev.md §2.2b](docs/markdown/dev/dev.md).

---

## Requirements

|          |                                                               |
| -------- | ------------------------------------------------------------- |
| Node.js  | 20 LTS or newer (see `.nvmrc`)                                |
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
│   │       ├── api/         fetch wrappers, JWT header, error toasts
│   │       ├── components/  UI — see components/README.md
│   │       ├── hooks/       TanStack Query — the only place that calls the API
│   │       ├── pages/       route targets (default exports)
│   │       └── store/       Zustand, auth state only
│   └── server/          Fastify 5 + TypeScript → Railway / Fly.io
│       └── src/
│           ├── routes/       path + middleware registration only
│           ├── controllers/  thin request/response layer
│           ├── services/     all business logic
│           ├── validators/   Zod schemas per resource
│           ├── middlewares/  auth, RBAC, error handler
│           └── lib/          env, prisma, jwt, response helpers
├── database/            schema.prisma (source of truth) + seed.ts
├── scripts/             setup.mjs
└── docs/                standards, diagrams, SQL reference
```

Each app deploys independently. They share nothing but the API contract and
`database/schema.prisma`. Every layer directory contains a `README.md`
describing its contract — read those before adding files.

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

CI (`.github/workflows/ci.yml`) runs the full `verify` pipeline plus a Docker
image build on every PR.

---

## Documentation

| Document                                                                                                                                                  | Contents                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [dev.md](docs/markdown/dev/dev.md)                                                                                                                        | Tech stack, setup, conventions, API standards, review checklist |
| [features-pages.md](docs/markdown/dev/features-pages.md)                                                                                                  | Feature and page scope — the scope source of truth              |
| [tech-stack.md](docs/markdown/graph/tech-stack.md)                                                                                                        | Architecture diagram                                            |
| [schema.md](docs/markdown/sql/schema.md)                                                                                                                  | Schema summary — `database/schema.prisma` wins on conflict      |
| [design-system.md](docs/markdown/dev/design-system.md)                                                                                                    | Design tokens and components                                    |
| [code-rule.md](docs/markdown/rule/code-rule.md) · [git-rule.md](docs/markdown/rule/git-rule.md) · [security-rule.md](docs/markdown/rule/security-rule.md) | Team rules                                                      |

Rebuild the browsable HTML docs with `npm run docs:build`.

---

## Project status

Early development. The database schema and the client/server skeletons are in
place; most API endpoints and pages are not implemented yet.

- **Working:** auth scaffolding, `GET /health`, Login / Users / CourseList pages
- **Scaffolded, not implemented:** the remaining routes in `app/server/src/routes/index.ts`
- **Scope:** 15 features / 15 pages — see [features-pages.md](docs/markdown/dev/features-pages.md)
