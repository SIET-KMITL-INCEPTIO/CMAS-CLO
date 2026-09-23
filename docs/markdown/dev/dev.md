# Technical Standard & Workflow

See also: [[Schema]] · [[Summary Project]] · [[website final]] · [[concept-clo MOC]]

## ระบบติดตามและประเมินผลลัพธ์การเรียนรู้ที่คาดหวังระดับรายวิชา (CLO System)

> **Version:** 2.0.0 | **Updated:** 2026-07 | **Owner:** ทีมพัฒนา 67030098 / 67030110 / 67030120

---

## สารบัญ

1. [Tech Stack](#1-tech-stack)
2. [Environment Setup](#2-environment-setup)
3. [Project Structure](#3-project-structure)
4. [Naming Conventions](#4-naming-conventions)
5. [Git Workflow](#5-git-workflow)
6. [Frontend Standards (React 19 + Vite)](#6-frontend-standards-react-19--vite)
7. [Backend Standards (Fastify + Node)](#7-backend-standards-fastify--node)
8. [Database Standards (Prisma 6 + Supabase)](#8-database-standards-prisma-6--supabase)
9. [API Design Standards (REST)](#9-api-design-standards-rest)
10. [Error Handling Standards](#10-error-handling-standards)
11. [Testing Standards](#11-testing-standards)
12. [CI/CD & Deployment](#12-cicd--deployment)
13. [Code Review Checklist](#13-code-review-checklist)
14. [Forbidden Patterns](#14-forbidden-patterns)
15. [Version Decisions Log](#15-version-decisions-log)

---

## 1. Tech Stack

| Layer               | Technology              | Version                | หมายเหตุ                                                    |
| -------------------- | ------------------------ | ----------------------- | ------------------------------------------------------------ |
| Frontend Framework    | React                    | 19.x                    | SPA (`ssr: false`), not framework/SSR mode                   |
| Routing               | React Router             | 7.x                     | Explicit route table (`pages.config.ts`), client-side only   |
| Build Tool            | Vite                     | 7.x                     | Held one major behind latest (8.x) — see §15                 |
| React Plugin          | `@vitejs/plugin-react-swc` | latest                | SWC, not Babel — faster builds                                |
| UI Framework          | Tailwind CSS             | 4.x                     | Via `@tailwindcss/vite` plugin — no PostCSS config needed    |
| Component Library     | shadcn/ui                | latest                  | Copy-paste, not installed as dep (`components.json` present) |
| State / Cache         | TanStack Query           | 5.x                     | Server state management                                       |
| Client State          | Zustand                  | 5.x                     | Auth state only, `persist` middleware                        |
| Forms                 | React Hook Form + Zod     | latest                  | Planned — not yet wired into any page                        |
| Charts                | Recharts                 | 3.x                     | CLO dashboard                                                 |
| Toast / Notifications | Sonner                   | 2.x                     | `<Toaster />` mounted once in `App.tsx`                       |
| Excel Processing      | xlsx (SheetJS)            | 0.20.3                  | **Installed from `cdn.sheetjs.com`, not npm registry** — see §15 |
| Backend Framework     | Fastify                  | 5.x                     | TypeScript-first                                               |
| Runtime               | Node.js                  | ≥20 LTS                 |                                                                |
| Language              | TypeScript               | 5.9.x                   | Held back from 7.x (native compiler) — see §15                |
| ORM                   | Prisma                   | 6.19.x                  | Held back from 7.x (breaking config model) — see §15          |
| Database              | PostgreSQL               | 15+ (Supabase)          |                                                                |
| Auth                  | JWT (`jose`)              | 6.x                     | Access token 15m + refresh token 7d, not a 30d single token    |
| Password Hashing      | argon2                   | latest                  |                                                                |
| Security Middleware   | `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/cors` | latest | |
| File Upload           | `@fastify/multipart`      | latest                  | 10MB cap                                                       |
| **Local Dev Container** | Docker + Docker Compose   | latest                  | `docker-compose up` runs client + server (w/ Supabase DB) w/ hot reload |
| **Server Image (dev)** | `node:20-alpine`          | 20-alpine               | Fastify dev server, bind-mounted source, connects to Supabase |
| **Server Image (prod)** | `node:20-alpine` (multi-stage) | latest            | Optimized build → Railway / Fly.io, non-root user, connects to Supabase |
| **Client Image (dev)** | `node:20-alpine`          | 20-alpine               | Vite dev server, `--host 0.0.0.0` for container access        |
| **Client Image (prod)** | `nginx:1.27-alpine` (multi-stage) | latest          | Static SPA via nginx w/ SPA fallback (try_files)              |
| **Database** | Supabase PostgreSQL 15    | managed                 | Single source: dev + prod both use Supabase (no local postgres container) |
| **Container Orchestration** | docker-compose.yml + docker-compose.prod.yml | — | Lightweight, both use Supabase connection string from .env  |
| Monorepo              | npm workspaces            | —                        | **Not pnpm** — see §15                                        |
| Linting               | ESLint 10 + typescript-eslint | latest              | Flat config, both apps                                         |
| Formatting            | *(not yet decided)*       | —                        | No Prettier/Biome configured yet                               |
| Testing               | *(not yet implemented)*   | —                        | Vitest/Playwright are planned, not installed                   |
| CI/CD                 | *(not yet implemented)*   | —                        | GitHub Actions workflows are planned, not present               |
| Hosting API           | Railway / Fly.io          | —                        |                                                                |
| Hosting Web           | Vercel                    | —                        |                                                                |
| Hosting DB            | Supabase                  | —                        |                                                                |

---

## 2. Environment Setup

### 2.1 Prerequisites

```bash
# ตรวจสอบ version ก่อนเริ่มต้น
node --version    # ต้องเป็น 20.x+
npm --version     # มากับ Node อยู่แล้ว — ไม่ต้องติดตั้ง pnpm
git --version     # ต้องเป็น 2.40+
```

> **หมายเหตุ:** โปรเจกต์นี้ใช้ **npm workspaces** ไม่ใช่ pnpm — เหตุผลอยู่ใน [§15](#15-version-decisions-log)

### 2.2 การ Clone และติดตั้ง

```bash
# 1. Clone repository
git clone https://github.com/<org>/clo-system.git
cd CMAS

# 2. ติดตั้ง dependencies ทั้ง monorepo (client + server) จาก root เดียว
npm install

# 3. Copy environment files
cp database/.env.example database/.env
cp app/server/.env.example app/server/.env
cp app/client/.env.example app/client/.env
# แก้ DATABASE_URL, DIRECT_URL, JWT_SECRET (32+ ตัวอักษร) ให้เป็นค่าจริง

# 4. Setup database
npm run db:generate       # สร้าง Prisma Client
npm run db:migrate:dev    # run migrations

# 5. รัน development server
npm run dev                # รัน client (:5173) + server (:3001) พร้อมกัน
npm run dev:client         # client อย่างเดียว
npm run dev:server         # server อย่างเดียว
```

### 2.2b การใช้ Docker (alternative — แนะนำ)

ถ้าต้องการ **consistency** ขอแนะนำใช้ Docker Compose — ทุกคน dev ด้วย Node 20 Alpine เดียวกัน และ database ชี้ไปที่ Supabase เดียวกัน (dev + prod)

**Prerequisites:** Docker + Docker Compose ให้เป็น latest stable

```bash
# 1. Clone (เหมือนเดิม)
git clone https://github.com/<org>/clo-system.git
cd CMAS

# 2. Copy + ตั้งค่า environment files
cp app/server/.env.example app/server/.env
cp app/client/.env.example app/client/.env

# 3. แก้ app/server/.env ให้ชี้ไปที่ Supabase (เหมือนทีมจริง)
# DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
# DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
# JWT_SECRET="[32+ character random string]"

# 4. สร้าง + รัน containers (client :5173 + server :3001)
docker compose up

# หรือถ้าต้องการ rebuild image (เช่นเพิ่ม package ใหม่)
docker compose up --build

# 5. ตรวจสอบ migrations (ถ้ายังไม่รัน)
docker compose exec server npm run db:migrate:dev
```

**ออกจาก Docker:**
```bash
docker compose down        # สตอป containers
```

**ประโยชน์:**
- ✅ ไม่ต้องติดตั้ง Node local — ทั้งหมดใน container
- ✅ ทุกคน run Node 20 Alpine เดียวกัน
- ✅ Hot reload ยังทำงาน (bind-mount source)
- ✅ Database ชี้ Supabase (dev ↔ prod เดียวกัน) — ไม่มี "works locally but not in prod"
- ✅ Production Dockerfile (`Dockerfile.prod`) ใช้ image เดียวกัน → guaranteed consistency ตั้ง local ถึง production

### 2.3 Environment Variables

**`database/.env`**

```dotenv
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
```

**`app/server/.env`**

```dotenv
# Database (mirrors database/.env)
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"

# Auth
JWT_SECRET="[random-256-bit-string, ต้องยาว 32+ ตัวอักษร — env.ts จะ throw ถ้าสั้นกว่านี้]"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# App
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:5173"

# Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW="1 minute"
```

**`app/client/.env`**

```dotenv
VITE_API_URL="http://localhost:3001"
VITE_APP_NAME="CLO System"
```

> ⚠️ **ห้าม commit ไฟล์ `.env` ลง git เด็ดขาด** — มีใน `.gitignore` แล้ว
>
> เซิร์ฟเวอร์จะ **refuse to boot** ถ้า `DATABASE_URL` หรือ `JWT_SECRET` หาย/สั้นเกินไป (`src/lib/env.ts` validate ด้วย Zod ตอน startup) — นี่คือ fail-fast โดยตั้งใจ ไม่ใช่บั๊ก

### 2.4 VS Code Extensions (แนะนำ)

**`.vscode/extensions.json`**

```json
{
  "recommendations": [
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense"
  ]
}
```

---

## 3. Project Structure

### 3.1 Monorepo Root (ตามที่ implement จริง)

```
CMAS/
├── app/
│   ├── client/          # React 19 + React Router 7 (SPA) — deploys to Vercel
│   └── server/           # Node.js + Fastify + TypeScript — deploys to Railway/Fly.io
├── database/
│   ├── schema.prisma      # single source of truth, shared by all tooling
│   ├── .env.example
│   ├── migrations/        # สร้างโดย Prisma — ห้ามเปลี่ยนชื่อโฟลเดอร์
│   └── seed.ts
├── docs/                  # ดู docs/README.md — markdown/ คือต้นฉบับ
├── scripts/               # setup.mjs + ตัวสร้าง/ตรวจ diagram, workbook
├── .gitignore
├── package.json            # root workspace scripts
└── README.md
```

แต่ละแอปใน `app/` deploy แยกจากกันได้อิสระ — `client` build เป็น static files, `server` build เป็น standalone Node process ไม่มี dependency ข้ามกัน ยกเว้น `database/schema.prisma` ที่ทั้งคู่อ้างอิงร่วมกัน

### 3.2 Frontend Structure (`app/client/`)

```
app/client/
├── src/
│   ├── features/                     # 1 โฟลเดอร์ต่อ feature — ชื่อตรงกับ app/server/src/modules/ (ดู features/README.md)
│   │   ├── auth/
│   │   │   ├── Login.page.tsx
│   │   │   └── useAuthStore.ts       # Zustand + persist (auth state เท่านั้น)
│   │   ├── users/
│   │   │   └── Users.page.tsx        # 5.1 จัดการสิทธิ์ผู้ใช้
│   │   ├── courses/
│   │   │   └── CourseList.page.tsx   # 5.2.1
│   │   ├── clos/                     # (TODO) Clos.page.tsx 5.2.2 · useClos.ts · clos.api.ts
│   │   ├── assessment/               # (TODO) Assessment.page.tsx 5.2.3
│   │   ├── excel/                    # (TODO) Excel.page.tsx 5.2.4 · ScoreUploadDialog.tsx · TemplateDownloadButton.tsx
│   │   ├── dashboard/                # (TODO) 5.3.1 Dashboard · 5.3.2 Students · 5.3.3 Report · CloBarChart.tsx
│   │   └── home/
│   │       └── Home.page.tsx
│   ├── components/                   # ใช้ร่วมตั้งแต่ 2 feature ขึ้นไปเท่านั้น
│   │   ├── ui/                       # shadcn/ui
│   │   └── layout/                   # AppShell, Sidebar, Topbar
│   ├── hooks/                        # hook ที่ใช้ร่วมตั้งแต่ 2 feature ขึ้นไปเท่านั้น
│   ├── lib/
│   │   ├── apiClient.ts              # fetch wrapper + JWT header + toast on error
│   │   ├── app.constants.ts          # API_URL, CLO_STATUS_COLORS
│   │   └── utils.ts                  # cn() — shadcn helper
│   ├── styles/                       # tokens / base / components / animations — @import จาก index.css
│   ├── types/
│   │   ├── api.types.ts              # ApiResponse<T>
│   │   └── user.types.ts             # User, Role
│   ├── App.tsx                       # <Toaster /> (sonner) + <BrowserRouter> + Suspense
│   ├── main.tsx
│   ├── index.css                     # @import "tailwindcss";
│   ├── pages.config.ts               # route table — เพิ่มหน้าใหม่ที่นี่
│   └── vite-env.d.ts
├── components.json                    # shadcn config (tsx: true)
├── eslint.config.ts
├── index.html
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── vite.config.ts                     # plugins: [react(), tailwindcss()]
```

> **ไม่มี** `tailwind.config.ts` — Tailwind v4 ผ่าน `@tailwindcss/vite` ตรวจจับ content อัตโนมัติจาก module graph ไม่ต้องตั้ง content globs เอง

### 3.3 Backend Structure (`app/server/`)

```
app/server/
├── src/
│   ├── index.ts                    # Fastify app + register plugins (helmet, cors, rate-limit, multipart)
│   ├── modules/                    # 1 โฟลเดอร์ต่อ feature — ดู modules/README.md
│   │   ├── index.ts                # registerRoutes() — รวมทุก module
│   │   ├── health/
│   │   │   └── health.route.ts     # GET /health
│   │   ├── authorization/
│   │   │   └── authorization.service.ts  # assertCourseAccess() — course-scope guard (NFR-07)
│   │   ├── auth/                   # (TODO) auth.route.ts · auth.controller.ts · auth.service.ts · user.repository.ts · auth.validator.ts
│   │   ├── users/                  # (TODO)
│   │   ├── courses/                # (TODO)
│   │   ├── clos/                   # (TODO)
│   │   ├── excel/                  # (TODO)
│   │   └── dashboard/              # (TODO)
│   ├── middlewares/
│   │   ├── auth.middleware.ts      # JWT verify → request.userId / request.userRole
│   │   ├── rbac.middleware.ts      # rbac("ADMIN" | "INSTRUCTOR")
│   │   └── error-handler.middleware.ts  # ZodError / Prisma error → standardized response
│   ├── db/
│   │   └── prisma.ts               # PrismaClient singleton — ใช้ใน *.repository.ts
│   └── lib/
│       ├── env.ts                  # Zod-validated process.env, fail-fast on boot
│       ├── jwt.ts                  # signAccessToken / signRefreshToken / verifyToken (jose)
│       └── response.ts             # ok / created / badRequest / unauthorized / forbidden / notFound / serverError
├── eslint.config.ts
├── package.json
└── tsconfig.json
```

### 3.4 Database (`database/`)

```
database/
├── schema.prisma    # User, Curriculum, CurriculumCourse,
│                     # Course, CLO, BehavioralObjective, Activity,
│                     # AssessmentCriteria, Student, Score, ScoreUploadLog
└── .env.example
```

Prisma client generate ไปที่ root `node_modules/@prisma/client` (npm workspace hoisting) — ทั้ง `app/server` และ tooling ที่ root เรียกใช้ `@prisma/client` ตัวเดียวกันได้โดยไม่ต้อง custom output path

---

## 4. Naming Conventions

### 4.1 กฎหลักด้านภาษา

> ชื่อทุกอย่างในโค้ด **ใช้ภาษาอังกฤษเท่านั้น** — comment และ commit message เขียนไทยได้

### 4.2 ไฟล์และโฟลเดอร์

| ประเภท | รูปแบบ | ตัวอย่าง |
| --- | --- | --- |
| Feature folder | `kebab-case/` ชื่อเดียวกันทั้ง client และ server | `features/clos/` ↔ `modules/clos/` |
| React Component | `PascalCase.tsx` | `CloListItem.tsx` |
| React Page | `PascalCase.page.tsx` (ใน `features/<name>/`) | `CourseList.page.tsx` |
| Hook | `camelCase.ts` ขึ้นต้นด้วย `use` | `useCloReorder.ts` |
| Client API wrapper | `camelCase.api.ts` | `clos.api.ts` |
| Utility / Helper | `camelCase.ts` | `formatDate.ts` |
| Fastify Route | `kebab-case.route.ts` | `clos.route.ts` |
| Controller | `kebab-case.controller.ts` | `clos.controller.ts` |
| Service | `kebab-case.service.ts` | `clos.service.ts` |
| Repository | `kebab-case.repository.ts` ตั้งตาม model (เอกพจน์) | `clo.repository.ts` |
| Validator | `kebab-case.validator.ts` | `clos.validator.ts` |
| Middleware | `kebab-case.middleware.ts` | `error-handler.middleware.ts` |
| Type / Interface | `camelCase.types.ts`, ใช้ `type` แทน `interface` | `course.types.ts` |
| Test | ชื่อไฟล์ที่ test + `.test.ts` | `cloScore.test.ts` |
| Constant | `camelCase.constants.ts` | `app.constants.ts` |

### 4.3 Variables & Functions

```typescript
// ✅ ถูก
const courseId = "abc123"                    // camelCase
const MAX_CLO_COUNT = 10                      // SCREAMING_SNAKE_CASE สำหรับ constant
function computeCloScore() {}                 // camelCase, verb-first
function getCourseById() {}                   // get + entity + qualifier
async function createCourse() {}              // async keyword ต้องมีเสมอ

// ✅ React Component — named export (ไม่ default export)
export function CloListItem() {}

// ✅ Types — PascalCase, ใช้ type แทน interface
type CloScore = { /* ... */ }
type CreateCloInput = { /* ... */ }            // suffix Input สำหรับ request body
type CloResponse = { /* ... */ }               // suffix Response สำหรับ response

// ❌ ผิด
const CourseId = "abc123"                     // PascalCase สำหรับ variable
const get_course = () => {}                   // snake_case
function course() {}                          // ไม่มี verb
interface IClo { /* ... */ }                  // Hungarian notation (I prefix)
```

### 4.4 Prisma / Database

```prisma
// ✅ ถูก
model Course { /* ... */ }      // PascalCase singular
courseId     String             // camelCase field name
@@unique([courseId, semester])

// ❌ ผิด
model courses { /* ... */ }     // lowercase / plural
course_id    String             // snake_case field
```

### 4.5 API Endpoints

```
// ✅ ถูก — noun plural, kebab-case, resource-based
GET    /courses
GET    /courses/:courseId
POST   /courses
PATCH  /courses/:courseId
DELETE /courses/:courseId
GET    /courses/:courseId/clos
PATCH  /courses/:courseId/clos/reorder   // action exception
POST   /excel/upload

// ❌ ผิด
GET    /getCourse           // verb ใน URL
GET    /course               // singular
POST   /courses/create       // redundant verb
GET    /Course                // PascalCase
```

---

## 5. Git Workflow

### 5.1 Branch Strategy (GitHub Flow)

```
main
  └── production เสมอ — protected branch, ห้าม push โดยตรง

feature/[issue-number]-[short-description]
  └── ตัวอย่าง: feature/12-clo-drag-reorder

fix/[issue-number]-[short-description]
  └── ตัวอย่าง: fix/34-score-upload-crash

hotfix/[short-description]
  └── ตัวอย่าง: hotfix/jwt-expiry-null-check

chore/[description]
  └── ตัวอย่าง: chore/upgrade-fastify-v6
```

### 5.2 Commit Message Convention (Conventional Commits)

```
<type>(<scope>): <subject>
```

**Types:**

| Type | ใช้เมื่อ |
| --- | --- |
| `feat` | เพิ่ม feature ใหม่ |
| `fix` | แก้บัค |
| `refactor` | เปลี่ยน code โดยไม่เพิ่ม feature หรือแก้บัค |
| `style` | แก้ formatting ไม่กระทบ logic |
| `test` | เพิ่ม/แก้ test |
| `docs` | แก้ documentation |
| `chore` | แก้ build, config, dependencies |
| `perf` | ปรับปรุง performance |
| `ci` | แก้ CI/CD config |

**Scopes:** `client` · `server` · `db` · `auth` · `clo` · `course` · `score` · `dashboard` · `excel`

**ตัวอย่าง:**

```bash
# ✅ ถูก
feat(clo): เพิ่ม drag-and-drop reorder สำหรับ CLO list
fix(score): แก้ไข weight computation เมื่อ activity ไม่มี CLO mapping
refactor(dashboard): แยก computation logic ออกจาก component
chore(server): upgrade fastify และ plugins เป็น major ล่าสุด

# ✅ มี body และ footer
feat(excel): เพิ่ม endpoint upload คะแนนจาก Excel template

เพิ่ม endpoint POST /excel/upload รับไฟล์ .xlsx ผ่าน multipart
parse ด้วย xlsx (SheetJS) แล้ว validate ทีละแถวก่อนบันทึก

Closes #42

# ❌ ผิด
update stuff                    # ไม่มี type
feat: แก้บัค                    # type ไม่ตรงกับ action
FEAT(CLO): ...                  # uppercase type
```

### 5.3 Pull Request Workflow

```bash
# 1. สร้าง branch จาก main
git checkout main
git pull origin main
git checkout -b feature/42-excel-upload

# 2. พัฒนา + commit แบบ selective
git add -p
git commit -m "feat(excel): เพิ่ม endpoint upload คะแนน"

# 3. Push
git push origin feature/42-excel-upload

# 4. ก่อน merge — sync กับ main ด้วย rebase (ไม่ใช่ merge)
git fetch origin
git rebase origin/main

# 5. แก้ conflict (ถ้ามี)
git rebase --continue

# 6. Force push หลัง rebase
git push --force-with-lease origin feature/42-excel-upload
```

**PR Requirements:**

- Title ต้องเป็น Conventional Commit format
- ผ่าน CI ทั้งหมด (lint + typecheck + build) — เมื่อตั้งค่า CI แล้ว (ดู §12)
- Reviewer อย่างน้อย 1 คน approve
- Merge แบบ **Squash and Merge** เสมอ
- ลบ branch หลัง merge

### 5.4 กฎที่ห้ามทำกับ Git

```bash
# ❌ ห้าม force push ที่ main
git push --force origin main

# ❌ ห้าม commit โดยตรงที่ main
git checkout main && git commit ...

# ❌ ห้าม commit ไฟล์เหล่านี้
.env, .env.local, .env.production
node_modules/
dist/, build/
uploads/
*.xlsm (ไฟล์ที่ generate)
```

---

## 6. Frontend Standards (React 19 + Vite)

### 6.1 Component Rules

```tsx
// ✅ named export เสมอ (ไม่ใช้ default export) — ยกเว้นไฟล์ page ที่ lazy() ต้องการ default export
export function CloListItem({ clo, onDelete }: CloListItemProps) {
  return <div>...</div>
}

// ✅ Props type อยู่เหนือ component
type CloListItemProps = {
  clo: CloWithObjectives
  onDelete: (id: string) => void
  className?: string
}

// ✅ ใช้ cn() สำหรับ conditional className
import { cn } from "@/lib/utils"

<div className={cn(
  "flex items-center gap-2 rounded-md border p-3",
  isAtRisk && "border-red-300 bg-red-50 text-red-700",
)} />

// ❌ ห้าม any
const data: any = /* ... */

// ❌ ห้าม useEffect สำหรับ data fetching
useEffect(() => { fetch("/api/clos") }, [])
```

> **หมายเหตุ:** หน้า `*.page.tsx` ต้องเป็น `export default` เพราะ `pages.config.ts` ใช้ `lazy(() => import(...))` ซึ่งต้องการ default export — นี่คือข้อยกเว้นเดียวของกฎ named-export

### 6.2 Routing Pattern (React Router 7 — explicit route table, ไม่ใช่ file-based)

โปรเจกต์นี้รันเป็น **SPA** (`react-router.config` เทียบเท่า คือ `vite.config.ts` ธรรมดา ไม่มี framework mode) route ทั้งหมดประกาศไว้ที่ `src/pages.config.ts` แบบ explicit ไม่ใช่ file-based routing:

```tsx
// src/pages.config.ts
import { lazy, type ComponentType, type LazyExoticComponent } from "react"

const CourseList = lazy(() => import("./features/courses/CourseList.page.tsx"))

export type AppRoute = { path: string; element: LazyExoticComponent<ComponentType> }

export const routes: AppRoute[] = [
  { path: "/courses", element: CourseList },
  // เพิ่มหน้าใหม่ที่นี่
]
```

```tsx
// src/App.tsx — รวม routes เข้ากับ <Routes>
{routes.map(({ path, element: Element }) => (
  <Route key={path} path={path} element={<Element />} />
))}
```

### 6.3 Data Fetching Pattern (TanStack Query + `apiClient`)

```tsx
// features/clos/clos.api.ts — API function layer
import { apiClient } from "../../lib/apiClient.ts"
import type { CloResponse } from "./clo.types.ts"

export const getClosByCourse = (courseId: string) =>
  apiClient.get<CloResponse[]>(`/courses/${courseId}/clos`)

// features/clos/useClos.ts — Query hook
export function useClos(courseId: string) {
  return useQuery({
    queryKey: ["clos", courseId],
    queryFn: () => getClosByCourse(courseId),
    enabled: Boolean(courseId),
  })
}

// Component — ใช้ hook เท่านั้น ไม่ fetch เอง
export function CloList({ courseId }: { courseId: string }) {
  const { data: clos, isLoading, isError } = useClos(courseId)

  if (isLoading) return <CloListSkeleton />
  if (isError) return <ErrorState />
  if (!clos?.length) return <EmptyState />

  return <div>{clos.map((c) => <CloListItem key={c.id} clo={c} />)}</div>
}
```

`apiClient` (`src/lib/apiClient.ts`) แนบ JWT header อัตโนมัติจาก `useAuthStore`, และเรียก `toast.error()` (sonner) ให้เองเมื่อ request ล้มเหลว — ไม่ต้องเขียน error toast ซ้ำในทุกที่ที่เรียก API

### 6.4 Excel Upload Pattern

```tsx
// features/excel/ScoreUploadDialog.tsx
// ใช้ xlsx (client-side) พรีวิวแถวก่อน submit เท่านั้น
// การ parse+validate จริงเกิดที่ server (excel.service.ts) เสมอ — ห้าม trust ฝั่ง client
```

### 6.5 CSS / Tailwind Rules

```tsx
// ✅ utility-first + cn() สำหรับ conditional
<div className={cn(
  "flex items-center gap-2 rounded-lg border p-3 text-sm",
  isAtRisk && "border-red-300 bg-red-50 text-red-700",
  isActive && "ring-2 ring-blue-500"
)} />

// ✅ shadcn variant pattern
const badgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5", {
  variants: {
    status: {
      pass: "bg-green-100 text-green-800",
      risk: "bg-red-100 text-red-800",
      warn: "bg-yellow-100 text-yellow-800",
    },
  },
})

// ❌ ห้าม inline style ถ้า Tailwind ทำได้
<div style={{ color: "red", fontSize: "14px" }} />

// ✅ exception — dynamic value ที่ Tailwind ทำไม่ได้
<div style={{ width: `${percentage}%` }} />
```

---

## 7. Backend Standards (Fastify + Node)

### 7.1 Request Flow

```
Request
  → Route      (path + middleware registration)
  → Controller (parse request, call service, return response)
  → Service    (all business logic lives here)
  → Repository (the only layer that talks to Prisma — code-rule §3)
  → Prisma     (db/prisma.ts)
```

**Route (`clos.route.ts`)** — ลงทะเบียน path + middleware เท่านั้น:

```typescript
import type { FastifyInstance } from "fastify"
import { authMiddleware } from "../../middlewares/auth.middleware.js"
import { rbac } from "../../middlewares/rbac.middleware.js"
import { prisma } from "../../db/prisma.js"
import { CloController } from "./clos.controller.js"
import { CloService } from "./clos.service.js"
import { CloRepository } from "./clo.repository.js"

export async function closRoutes(app: FastifyInstance) {
  const ctrl = new CloController(new CloService(new CloRepository(prisma)))

  app.addHook("preHandler", authMiddleware)
  app.get("/", ctrl.list)
  app.post("/", { preHandler: rbac("INSTRUCTOR") }, ctrl.create)
  app.patch("/reorder", { preHandler: rbac("INSTRUCTOR") }, ctrl.reorder)
}
```

**Controller (`clos.controller.ts`)** — บาง (thin layer), ไม่มี logic:

```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { CloService } from "./clos.service.js"
import { createCloSchema } from "./clos.validator.js"
import { ok, created } from "../../lib/response.js"

export class CloController {
  constructor(private readonly service: CloService) {}

  list = async (request: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) => {
    const clos = await this.service.listByCourse(request.params.courseId)
    return ok(reply, clos)
  }

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createCloSchema.parse(request.body) // throws ZodError → errorHandler จัดการ
    const clo = await this.service.create(parsed)
    return created(reply, clo)
  }
}
```

**Service (`clos.service.ts`)** — business logic ทั้งหมด:

```typescript
// ตัวอย่างนี้เรียก prisma ตรง ๆ เพื่อให้สั้น — โค้ดจริงต้องผ่าน clo.repository.ts ตาม code-rule §3
import { prisma } from "../../db/prisma.js"
import type { CreateCloInput } from "./clos.validator.js"

export class CloService {
  async listByCourse(courseId: string) {
    return prisma.cLO.findMany({
      where: { courseId },
      include: { objectives: true, criteria: true },
      orderBy: { number: "asc" },
    })
  }

  async create(data: CreateCloInput) {
    const last = await prisma.cLO.findFirst({
      where: { courseId: data.courseId },
      orderBy: { number: "desc" },
    })
    return prisma.cLO.create({
      data: { ...data, number: (last?.number ?? 0) + 1 },
    })
  }
}
```

### 7.2 Middleware (Fastify `preHandler` hooks)

```typescript
// middlewares/auth.middleware.ts — ดูของจริงที่ app/server/src/middlewares/auth.middleware.ts
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined
  if (!token) return unauthorized(reply)

  try {
    const payload = await verifyToken(token)
    request.userId = payload.sub
    request.userRole = payload.role
  } catch {
    return unauthorized(reply, "Invalid or expired token")
  }
}

// middlewares/rbac.middleware.ts
export function rbac(requiredRole: "ADMIN" | "INSTRUCTOR") {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.userRole !== requiredRole && request.userRole !== "ADMIN") {
      return forbidden(reply)
    }
  }
}
```

### 7.3 Standardized Response (`lib/response.ts`)

```typescript
type ApiResponse<T> = { success: boolean; data?: T; message?: string; errors?: unknown }

export const ok        = <T>(reply: FastifyReply, data: T) => reply.status(200).send({ success: true, data })
export const created    = <T>(reply: FastifyReply, data: T) => reply.status(201).send({ success: true, data })
export const badRequest = (reply: FastifyReply, errors: unknown) => reply.status(400).send({ success: false, errors })
export const unauthorized = (reply: FastifyReply, message = "Unauthorized") => reply.status(401).send({ success: false, message })
export const forbidden  = (reply: FastifyReply, message = "Forbidden") => reply.status(403).send({ success: false, message })
export const notFound   = (reply: FastifyReply, message = "Not found") => reply.status(404).send({ success: false, message })
export const serverError = (reply: FastifyReply, message = "Internal server error") => reply.status(500).send({ success: false, message })
```

### 7.4 Auth Token Policy

```typescript
// lib/jwt.ts — access token สั้น + refresh token แยก (ไม่ใช่ token เดียวอายุ 30 วัน)
JWT_ACCESS_EXPIRES_IN  = "15m"
JWT_REFRESH_EXPIRES_IN = "7d"
```

---

## 8. Database Standards (Prisma 6 + Supabase)

### 8.1 Migration Rules

```bash
# สร้าง migration ใหม่ (development เท่านั้น)
npm run db:migrate:dev

# Apply ใน production
npm run db:migrate:deploy

# ❌ ห้าม edit migration file ที่ถูก apply ไปแล้ว
# ❌ ห้าม prisma db push ใน production
# ✅ สร้าง migration ใหม่เสมอเมื่อต้องการเปลี่ยน schema
```

> **สำคัญ:** โปรเจกต์นี้ค้างอยู่ที่ **Prisma 6.19.x โดยตั้งใจ** — Prisma 7 ย้าย `url`/`directUrl` ออกจาก `schema.prisma` ไปอยู่ใน `prisma.config.ts` และบังคับใช้ driver adapter (`@prisma/adapter-pg`) แทน ก่อน upgrade ต้องอ่าน [Prisma 7 migration guide](https://pris.ly/d/config-datasource) และวางแผน migration เป็นงานแยกต่างหาก ไม่ใช่ patch bump

### 8.2 Prisma Query Rules

```typescript
// ✅ select เฉพาะ field ที่ต้องการ
const course = await prisma.course.findFirst({
  where: { id: courseId },
  select: {
    id: true, name: true, code: true,
    clos: { select: { id: true, number: true, description: true } },
  },
})

// ✅ Transaction สำหรับ operation ที่ต้อง atomic
await prisma.$transaction(async (tx) => {
  const course = await tx.course.create({ data: { /* ... */ } })
  await tx.cLO.createMany({ data: clos.map((c) => ({ ...c, courseId: course.id })) })
  return course
})

// ✅ ใช้ OrThrow variants แทนการ check null เอง
const clo = await prisma.cLO.findUniqueOrThrow({ where: { id } })

// ❌ ห้าม N+1 query
for (const course of courses) {
  course.clos = await prisma.cLO.findMany({ where: { courseId: course.id } })
}
// ✅ ใช้ include แทน
const courses = await prisma.course.findMany({ include: { clos: true } })

// ❌ ห้าม raw query ถ้า Prisma ทำได้
await prisma.$queryRaw`SELECT * FROM "CLO"`
```

### 8.3 Score Audit Trail

`ScoreUploadLog` model บันทึกทุกครั้งที่มีการ upload คะแนนผ่าน Excel (`courseId`, `uploadedBy`, `fileName`, `recordsOk`, `recordsFail`) — ใช้สำหรับตรวจสอบย้อนหลังเมื่อมีข้อพิพาทเรื่องคะแนน

---

## 9. API Design Standards (REST)

### 9.1 Response Format (ใช้ทุก endpoint)

```json
// Success
{ "success": true, "data": { "...": "..." } }

// List พร้อม pagination
{
  "success": true,
  "data": ["..."],
  "meta": { "total": 35, "page": 1, "perPage": 20 }
}

// Error
{
  "success": false,
  "message": "CLO not found",
  "errors": { "...": "..." }
}
```

### 9.2 HTTP Status Codes

| Code | ใช้เมื่อ |
| --- | --- |
| `200` | GET / PATCH / DELETE สำเร็จ |
| `201` | POST สร้าง resource สำเร็จ |
| `400` | Validation error, malformed body |
| `401` | ไม่มี token หรือ token expired |
| `403` | มี token แต่ role ไม่มีสิทธิ์ |
| `404` | Resource ไม่พบ |
| `409` | Conflict (duplicate key) |
| `422` | Logic error (weight > 100%, score > maxScore) |
| `429` | Rate limit เกิน (`@fastify/rate-limit`) |
| `500` | Unexpected server error |

---

## 10. Error Handling Standards

### 10.1 Backend — Global Error Handler (`app.setErrorHandler`)

```typescript
// middlewares/error-handler.middleware.ts — ของจริงอยู่ที่ app/server/src/middlewares/error-handler.middleware.ts
export function errorHandler(err: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) {
  request.log.error(err)

  if (err instanceof ZodError) return badRequest(reply, err.flatten())

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return badRequest(reply, "Duplicate entry")
    if (err.code === "P2025") return notFound(reply, "Record not found")
  }

  return serverError(reply)
}

// index.ts
app.setErrorHandler(errorHandler)
```

### 10.2 Frontend — API Error Handling

```tsx
// apiClient (src/lib/apiClient.ts) throw + toast.error() ให้อัตโนมัติเมื่อ res.ok เป็น false
// Component ใช้ isError จาก TanStack Query สำหรับ inline error state
const { data, isError, error } = useQuery(/* ... */)
if (isError) return <ErrorState message={error.message} />

// ❌ ห้าม silent catch
try {
  await doSomething()
} catch {
  // ไม่ทำอะไรเลย ❌
}
```

---

## 11. Testing Standards

> **สถานะปัจจุบัน: ยังไม่ implement** — ส่วนนี้เป็นแผนที่ตกลงกันไว้ ไม่ใช่สิ่งที่มีอยู่จริงในโค้ดตอนนี้ อย่าอ้างอิงว่า "มี test" จนกว่าจะติดตั้งจริง

### 11.1 แผน — Unit Tests (Vitest)

```typescript
// ตัวอย่างเป้าหมาย: computation logic ล้วนๆ ไม่มี side effect
describe("computeCloScore", () => {
  it("คำนวณถูกต้องเมื่อมีหลาย activity", () => {
    const result = computeCloScore({
      activities: [
        { score: 8, maxScore: 10, weight: 0.4 },
        { score: 25, maxScore: 50, weight: 0.6 },
      ],
    })
    expect(result).toBeCloseTo(62, 0)
  })
})
```

**Coverage Targets (เมื่อเริ่ม implement):**

| Layer | Min Coverage |
| --- | --- |
| computation logic (คำนวณ CLO score, at-risk) | 90% |
| `app/server/src/modules/*/*.service.ts` | 80% |
| `app/server/src/modules/*/*.validator.ts` | 90% |
| `app/client/src/**/use*.ts` | 70% |

### 11.2 แผน — Integration & E2E

Integration tests (Fastify `inject()`) และ E2E (Playwright) ยังไม่ตั้งค่า — จะเพิ่มเมื่อ auth flow เสร็จและมี endpoint จริงให้ทดสอบ

---

## 12. CI/CD & Deployment

> **สถานะปัจจุบัน: ยังไม่ตั้งค่า GitHub Actions จริง** — ตารางด้านล่างคือ deploy target ที่ตั้งใจไว้และ verify แล้วว่า build ผ่านจริง (`npm run build` ที่ root รัน client + server สำเร็จ)

### 12.1 Deploy Targets

| App | Target | Root directory setting |
| --- | --- | --- |
| `app/client` | Vercel | `app/client` |
| `app/server` | Railway / Fly.io | `app/server` |
| Database | Supabase (Postgres) | — |

ตั้ง "root directory" ของแต่ละ deploy target ไปที่โฟลเดอร์ `app/*` ที่เกี่ยวข้อง — ทำให้แต่ละ platform install เฉพาะ dependency ของ workspace นั้น ไม่ต้อง build ทั้ง monorepo และ client/server ship แยกรอบกันได้

### 12.2 Pre-Deploy Checklist (ทำทุกครั้งก่อน merge to main)

```
[ ] npm run build          — client + server ไม่มี error
[ ] npm run typecheck -w app/client
[ ] npm run typecheck -w app/server
[ ] npm run lint -w app/client
[ ] npm run lint -w app/server
[ ] npm audit               — 0 vulnerabilities
[ ] Environment variables ครบทุกตัวบน Railway/Vercel
[ ] npm run db:migrate:deploy — migration apply สำเร็จ
[ ] CORS_ORIGIN ตรงกับ production domain
[ ] JWT_SECRET ใช้ค่า random จริง (32+ ตัวอักษร) ไม่ใช่ placeholder
[ ] Supabase database backup ก่อน run migration
```

### 12.3 Environments

| Environment | Branch | URL |
| --- | --- | --- |
| Development | local | `localhost:5173` + `localhost:3001` |
| Preview | `feature/*` | Auto-deploy Vercel Preview |
| Production | `main` | TBD |

---

## 13. Code Review Checklist

ใช้รายการนี้ทุกครั้งก่อน approve PR:

### Correctness

- [ ] Logic ถูกต้อง ทดสอบ edge case แล้ว
- [ ] ไม่มี N+1 query
- [ ] Transaction ครอบ operation ที่ต้องเป็น atomic

### Code Quality

- [ ] ไม่มี `any` type
- [ ] ไม่มี hardcoded string ที่ควรเป็น constant หรือ env
- [ ] Function ทำสิ่งเดียว (Single Responsibility)
- [ ] ชื่อ variable/function สื่อความหมาย อ่านแล้วเข้าใจ

### Security

- [ ] Input validation ครบทุก endpoint (Zod)
- [ ] ไม่มีข้อมูล sensitive ใน log หรือ response
- [ ] Authorization check ครบ (ไม่ใช่แค่ Authentication — ต้อง check resource ownership ด้วย เช่น instructor แก้ได้เฉพาะ course ตัวเอง)
- [ ] ไม่มี secret/credential hardcode ในโค้ด
- [ ] Excel upload validate ทั้ง file type, size, และเนื้อหาแต่ละแถวก่อนบันทึก

### Testing

- [ ] มี test ครอบ happy path (เมื่อเริ่มมี testing infra แล้ว)
- [ ] มี test ครอบ error/edge case

### Git

- [ ] Commit message ถูกต้องตาม Conventional Commits
- [ ] ไม่มีไฟล์ที่ไม่เกี่ยวข้องติดมาใน PR
- [ ] ไม่มีไฟล์ `.env` หรือ secrets

---

## 14. Forbidden Patterns

รายการนี้จะถูก **reject ทันที** ใน code review:

```typescript
// ❌ 1. ใช้ any
const data: any = await fetch(/* ... */)

// ❌ 2. Business logic อยู่ใน route หรือ controller
app.get("/clos", async (request, reply) => {
  const clos = await prisma.cLO.findMany()  // query ตรงใน route
  return reply.send(clos)
})

// ❌ 3. useEffect สำหรับ data fetching
useEffect(() => { fetchClos() }, [courseId])

// ❌ 4. Inline style ที่ Tailwind ทำได้
<div style={{ color: "red", fontSize: "14px" }} />

// ❌ 5. Default export สำหรับ component (ยกเว้นไฟล์ page ที่ pages.config.ts lazy-import)
export default function CloList() {}

// ❌ 6. Commit .env
git add .env && git commit ...

// ❌ 7. Force push main
git push --force origin main

// ❌ 8. Silent error catch
try { /* ... */ } catch {}

// ❌ 9. Fetch data ในตัว component โดยตรง (bypass query hooks / apiClient)
const [data, setData] = useState(null)
useEffect(() => {
  fetch("/api/clos").then((r) => r.json()).then(setData)
}, [])

// ❌ 10. Commit generated files
git add dist/ node_modules/

// ❌ 11. String concatenation กับ SQL
db.query("SELECT * FROM clo WHERE id = " + id)   // SQL Injection

// ❌ 12. Hardcode secrets
const JWT_SECRET = "mysecret123"  // ต้องมาจาก process.env เสมอ (validate ผ่าน env.ts)

// ❌ 13. N+1 Query
for (const course of courses) {
  course.clos = await prisma.cLO.findMany({ where: { courseId: course.id } })
}

// ❌ 14. ติดตั้ง xlsx จาก npm registry ตรงๆ
"xlsx": "^0.18.5"   // เวอร์ชันนี้บน npm มีช่องโหว่ ReDoS + prototype pollution ที่ไม่มี patch
// ✅ ต้องติดตั้งจาก SheetJS CDN แทน (ดู §15)
"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"
```

---

## 15. Version Decisions Log

เอกสารนี้บันทึกเหตุผลของ version ที่ **ตั้งใจไม่ใช้ล่าสุด** เพื่อไม่ให้ใครเผลอ `npm update` แล้วพังโดยไม่รู้สาเหตุ

| Package | Held at | Latest available | เหตุผล |
| --- | --- | --- | --- |
| `prisma` / `@prisma/client` | 6.19.3 | 7.8.0 | Prisma 7 ลบ `url`/`directUrl` ออกจาก `schema.prisma` ทั้งหมด ย้ายไป `prisma.config.ts` และบังคับใช้ driver adapter (`@prisma/adapter-pg`) แทน — เป็นการเปลี่ยนสถาปัตยกรรมจริง ไม่ใช่แค่ bump version ทีมเล็ก 3 คน ระยะเวลาโปรเจกต์จำกัด ไม่คุ้มความเสี่ยง |
| `typescript` | 5.9.3 | 7.0.2 | TS 7 คือ native compiler ที่เขียนใหม่ด้วย Go ยังใหม่มาก ความเข้ากันได้กับ `tsx`/`typescript-eslint` ยังไม่ยืนยัน |
| `vite` | 7.3.6 | 8.1.4 | เลือก pin ตามหลัง latest หนึ่ง major แบบระมัดระวัง แทนที่จะไล่ตาม major ล่าสุดทันที |
| `xlsx` | 0.20.3 (จาก `cdn.sheetjs.com`) | — | เวอร์ชันบน **npm registry เก่าและไม่มี patch** สำหรับช่องโหว่ ReDoS + prototype pollution (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9) SheetJS ปล่อย patch ผ่าน CDN ของตัวเองเท่านั้น ไม่ผ่าน npm — ต้องติดตั้งจาก URL ตรง |
| Package manager | npm workspaces | — | เดิมตั้งใจใช้ pnpm ตามแผนแรก แต่ `corepack enable` ต้องการสิทธิ์ admin ที่ไม่มีในเครื่อง dev — เปลี่ยนมาใช้ npm workspaces เพราะไม่ต้องติดตั้งอะไรเพิ่มเลย (มากับ Node อยู่แล้ว) ลดแรงเสียดทานตอน setup ให้เพื่อนร่วมทีม |
| Backend framework | Fastify (ไม่ใช่ Hono) | — | เปลี่ยนจาก Hono → Node/Express → **Fastify** เพื่อ throughput สูงกว่า (schema-based serialization) และ schema validation ในตัวที่ช่วยเรื่อง security ไปพร้อมกัน |

> **กฎ:** ก่อน upgrade package ในตารางนี้ ต้องอ่านเหตุผลด้านบนก่อน ถ้าเหตุผลนั้นไม่ valid แล้ว (เช่น Prisma 7 มี migration guide ที่ชัดเจนขึ้น หรือ TS 7 เสถียรแล้ว) ให้เปิด PR แยกสำหรับ upgrade นั้นโดยเฉพาะ พร้อม verify ว่า build/typecheck/boot ผ่านจริงก่อน merge — อย่า bump รวมกับ PR feature อื่น

---

## Appendix A: Root `package.json` Scripts

```json
{
  "scripts": {
    "dev": "concurrently -n CLIENT,SERVER -c blue,green \"npm run dev -w app/client\" \"npm run dev -w app/server\"",
    "dev:client": "npm run dev -w app/client",
    "dev:server": "npm run dev -w app/server",
    "build": "npm run build -w app/client && npm run build -w app/server",
    "build:client": "npm run build -w app/client",
    "build:server": "npm run build -w app/server",
    "lint": "npm run lint -w app/client && npm run lint -w app/server",
    "db:generate": "prisma generate --schema=database/schema.prisma",
    "db:migrate:dev": "prisma migrate dev --schema=database/schema.prisma",
    "db:migrate:deploy": "prisma migrate deploy --schema=database/schema.prisma",
    "db:studio": "prisma studio --schema=database/schema.prisma",
    "db:seed": "node database/seed.js"
  }
}
```

## Appendix B: `.gitignore`

```gitignore
# Dependencies
node_modules/

# Build output
dist/
build/

# Environment
.env
.env.local
.env.production
.env.*.local

# OS
.DS_Store
Thumbs.db

# Editor
.idea/
*.swp

# Logs
*.log
logs/

# Generated Excel files / uploads
*.xlsm
uploads/
```

---

_เอกสารนี้มีผลบังคับใช้กับทุกสมาชิกในทีม_ _หากต้องการเปลี่ยนแปลง standard ให้ทำ PR แก้ไขเอกสารนี้และ vote เห็นชอบอย่างน้อย 2 ใน 3 คนก่อน merge_
