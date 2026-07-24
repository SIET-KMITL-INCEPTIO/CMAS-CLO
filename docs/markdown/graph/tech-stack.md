# Tech Stack

> อ้างอิงจาก [[dev]] §1 — CLO System (สถานะจริง ณ 2026-07)

## Infrastructure & Containerization

| Component | Technology | Usage |
|---|---|---|
| **Local Dev** | Docker + Docker Compose | client (:5173) + server (:3001), connects to Supabase |
| **Server Container** | `node:20-alpine` (dev), multi-stage build (prod) | Fastify app, hot reload, Supabase connection |
| **Client Container** | `node:20-alpine` (dev), nginx:alpine (prod) | React SPA, static files |
| **Database** | Supabase PostgreSQL 15 | Single database: dev + prod (no local postgres container) |

For more, see [[dev]] §2.2b Docker Setup

---

```mermaid
flowchart TB
    subgraph CLIENT["🖥️ Frontend — app/client (deploy: Vercel)"]
        direction TB
        R["React 19"]
        RR["React Router 7 (SPA, ssr:false)"]
        VITE["Vite 7 + plugin-react-swc"]
        TW["Tailwind CSS 4 (@tailwindcss/vite)"]
        SHAD["shadcn/ui"]
        TQ["TanStack Query 5"]
        ZU["Zustand 5 (auth state)"]
        RC["Recharts 3 (dashboard)"]
        SN["Sonner 2 (toast)"]
        XLC["xlsx / SheetJS (preview)"]
    end

    subgraph SERVER["⚙️ Backend — app/server (deploy: Railway / Fly.io)"]
        direction TB
        NODE["Node.js ≥20 LTS"]
        FST["Fastify 5"]
        TS["TypeScript 5.9"]
        SEC["helmet · cors · rate-limit · multipart"]
        JWT["jose 6 (JWT: 15m access + 7d refresh)"]
        ARG["argon2 (password hash)"]
        ZOD["Zod (validation)"]
        XLS["xlsx / SheetJS (parse + validate)"]
    end

    subgraph DATA["🗄️ Data Layer"]
        direction TB
        PRISMA["Prisma 6 (ORM)"]
        SUPA["Supabase PostgreSQL 15+"]
    end

    CLIENT -->|"REST /api (fetch + JWT header)"| SERVER
    SERVER -->|"Prisma Client"| PRISMA
    PRISMA --> SUPA
    SUPA ---|"dev + prod"| DB["Database"]

    subgraph TOOL["🔧 Tooling"]
        direction TB
        NPM["npm workspaces (monorepo)"]
        ESL["ESLint 10 + typescript-eslint"]
        DOCKER["Docker + Docker Compose (dev/prod parity)"]
        LINT["Formatter: (not yet decided)"]
    end

    subgraph INFRA["☁️ Infrastructure"]
        direction LR
        VER["Vercel (client)"]
        RAIL["Railway / Fly.io (server)"]
        DB["Supabase (Postgres)"]
    end

    NPM -.-> CLIENT
    NPM -.-> SERVER
    ESL -.-> CLIENT
    ESL -.-> SERVER
    DOCKER -.-> CLIENT
    DOCKER -.-> SERVER
    CLIENT -.-> VER
    SERVER -.-> RAIL
    PG -.-> DB
```
