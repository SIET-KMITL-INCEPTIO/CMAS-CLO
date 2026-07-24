# CLO System

Course Monitoring and Assessment System for Course Learning Outcomes — see [`docs/`](./docs) for the approved project topic (PD01) and technical standards.

## Structure

```
CMAS/
├── app/
│   ├── client/     # React 19 + React Router 7 (SPA) — deploys to Vercel
│   └── server/     # Node.js + Fastify + TypeScript — deploys to Railway/Fly.io
├── database/       # Prisma schema, shared by tooling and server
└── docs/           # approved topic PDF, tech stack, schema, standards
```

Each app under `app/` is independently deployable — `client` builds to static files, `server` builds to a standalone Node process. They share nothing except the API contract and `database/schema.prisma`.

## Setup

```bash
npm install                      # installs both workspaces from root
cp database/.env.example database/.env
cp app/server/.env.example app/server/.env
cp app/client/.env.example app/client/.env
# fill in DATABASE_URL, DIRECT_URL, JWT_SECRET (32+ chars)

npm run db:generate               # generate Prisma client
npm run db:migrate:dev            # run first migration
```

## Development

```bash
npm run dev            # runs client (:5173) + server (:3001) together
npm run dev:client      # client only
npm run dev:server      # server only
```

## Build

```bash
npm run build           # builds both
npm run build:client
npm run build:server
```

## Deploy

| App | Target | Root directory setting |
|---|---|---|
| `app/client` | Vercel | `app/client` |
| `app/server` | Railway / Fly.io | `app/server` |
| Database | Supabase (Postgres) | — |

Both deploy targets should point their build "root directory" at the respective `app/*` folder — this lets each platform install only that workspace's dependencies rather than the whole monorepo, and lets client/server ship on independent schedules.

## Conventions

See [`docs/dev.md`](./docs/dev.md) for naming, Git workflow, and code review checklist (note: backend examples there reference Hono — the project has since moved to Fastify; routes/controllers/services layering still applies).
