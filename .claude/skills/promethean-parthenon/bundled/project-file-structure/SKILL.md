---
name: project-file-structure
description: Rules for naming and placing every file and folder in a React + TypeScript + Node + Prisma project whose documentation lives in an Obsidian vault, plus PDF handling. Use this skill whenever creating a new file, adding a new feature, renaming something, moving a file, writing a Prisma model or migration, adding a note to the vault, reviewing a pull request that adds files, or when the user asks where a file should go, what to call it, or says they cannot find a file. Apply it even when the user only asks "make a component" or "add an API route" without mentioning structure.
---

# Project File Structure

Three rules decide everything:

1. **Case is correct** — every file type has one naming case. No exceptions.
2. **Files are connected** — one feature keeps all its files together, names match across layers, and every note links to the code it describes.
3. **Findable in 10 seconds** — the name says what it is, so you never open a file to check.

---

## 1. Naming rules (case)

### Code

| What | Case | Example |
|---|---|---|
| Folder | `kebab-case` | `features/order-history/` |
| React component | `PascalCase.tsx` | `UserCard.tsx` |
| React page | `PascalCase.page.tsx` | `Login.page.tsx` |
| Hook | `camelCase.ts`, starts with `use` | `useAuth.ts` |
| Util / helper | `camelCase.ts` | `formatDate.ts` |
| Type file | `camelCase.types.ts` | `user.types.ts` |
| Constants | `camelCase.constants.ts` | `route.constants.ts` |
| Node route | `kebab-case.route.ts` | `order-history.route.ts` |
| Node controller | `kebab-case.controller.ts` | `order-history.controller.ts` |
| Node service | `kebab-case.service.ts` | `order-history.service.ts` |
| Prisma repository | `kebab-case.repository.ts` | `order.repository.ts` |
| Test | same name + `.test.ts(x)` | `UserCard.test.tsx` |
| PDF template | `kebab-case.template.ts` | `invoice.template.ts` |
| Generated PDF | `kebab-case-<id>_YYYY-MM-DD.pdf` | `invoice-1042_2026-07-29.pdf` |
| Static PDF asset | `kebab-case.pdf` | `user-manual.pdf` |

### Prisma

| What | Case | Example |
|---|---|---|
| Schema file | `kebab-case.prisma` | `prisma/schema/order.prisma` |
| Model name | `PascalCase`, **singular** | `model OrderItem` |
| Field | `camelCase` | `createdAt` |
| Enum | `PascalCase` / values `SCREAMING_CASE` | `enum OrderStatus { PENDING }` |
| Table mapping | `@@map("snake_case")` plural | `@@map("order_items")` |
| Column mapping | `@map("snake_case")` | `@map("created_at")` |
| Migration | **Prisma generates it** — you only pass `--name` in `snake_case` | `20260729093000_add_user_avatar/` |
| Seed | fixed name | `prisma/seed.ts` |

Never hand-write or rename a migration folder. `npx prisma migrate dev --name add_user_avatar` — verb first, snake_case, no dates in the name (Prisma adds the timestamp).

Never hand-write model types either. `Order`, `Prisma.OrderCreateInput` come from `@prisma/client`. `*.types.ts` files hold only your own DTOs and view models, and they should import and extend the generated ones.

### Obsidian notes

| What | Case | Example |
|---|---|---|
| Note | `kebab-case.md` | `order-history.md` |
| Index / MOC | `00-index.md`, `00-<area>-moc.md` | `00-api-moc.md` |
| ADR | `NNNN-kebab-case.md` | `0007-use-prisma-migrate.md` |
| Daily note | `YYYY-MM-DD.md` | `2026-07-29.md` |
| Attachment | `kebab-case.png` / `.pdf` | `order-flow-diagram.png` |
| Tag | `#kebab-case`, nested with `/` | `#area/api`, `#status/draft` |

Filenames stay `kebab-case` (safe in git, safe in URLs). The human-readable title goes in frontmatter, and Obsidian shows it if you turn on *Settings → Files & Links → Show frontmatter title*. Link with an alias so notes still read naturally: `[[order-history|Order history]]`.

Hard bans everywhere: no spaces, no non-ASCII, no `final`, `new`, `old`, `copy`, `v2`, `temp`. Version lives in git.

**Suffix > folder.** `order-history.service.ts` beats `services/order-history.ts` — searching `order-history` shows the whole feature at once.

---

## 2. Folder layout

```
repo/
├── README.md                      ← points into the vault
├── vault/                         ← the Obsidian vault, open THIS folder in Obsidian
│   ├── 00-index.md
│   ├── features/
│   ├── api/
│   ├── adr/
│   ├── daily/
│   ├── templates/                 ← Obsidian Templates plugin folder
│   └── attachments/               ← images + reference PDFs
├── prisma/
│   ├── schema/                    ← split schema, one file per domain
│   │   ├── schema.prisma          ← datasource + generator only
│   │   ├── user.prisma
│   │   └── order.prisma
│   ├── migrations/                ← generated, never edited by hand
│   └── seed.ts
├── apps/
│   ├── web/src/
│   │   ├── features/              ← the important one, see below
│   │   ├── components/            ← shared UI only
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   └── api/src/
│       ├── modules/               ← mirrors web/features
│       ├── db/
│       │   └── prisma.ts          ← the single PrismaClient instance
│       ├── pdf/templates/
│       └── lib/
└── storage/pdf/                   ← generated PDFs, gitignored
```

`.gitignore` must contain `vault/.obsidian/workspace.json`, `vault/.trash/`, `storage/`. Commit the rest of `.obsidian/` if the team shares plugin settings.

### Feature folder = the "connecting" rule

One feature, one name, everywhere:

```
vault/features/order-history.md
prisma/schema/order.prisma
apps/api/src/modules/order-history/
├── order-history.route.ts
├── order-history.controller.ts
├── order-history.service.ts
├── order.repository.ts
└── order-history.service.test.ts
apps/web/src/features/order-history/
├── OrderHistory.page.tsx
├── OrderTable.tsx
├── useOrderHistory.ts
├── orderHistory.api.ts
└── OrderTable.test.tsx
```

The chain is readable end to end:

`OrderHistory.page.tsx` → `useOrderHistory.ts` → `orderHistory.api.ts` → `order-history.route.ts` → `order-history.controller.ts` → `order-history.service.ts` → `order.repository.ts` → `prisma/schema/order.prisma` → `prisma/migrations/…_create_order/`

Web uses `camelCase` for the file base, API and vault use `kebab-case`, all from the **same words**: `order-history` ↔ `orderHistory`. Never `orders` on one side and `order-history` on the other.

### When something is shared

Move to `components/`, `hooks/`, or `lib/` **only after a second feature uses it**. Copy once, extract on the third use.

---

## 3. The 10-second rule

A file passes if the path alone answers: what layer, what feature, code or note or output.

### In code
- Search the feature word: `order-history` returns every layer.
- Search a suffix: `.service.ts` returns all services.
- Max depth inside `src/`: 4 levels. Deeper means split the feature.
- One default export per file, named the same as the file.

### In the vault
Every note starts with frontmatter — this is what makes notes findable, not folders:

```yaml
---
title: Order history
tags: [area/api, area/web, status/stable]
feature: order-history
code:
  - apps/api/src/modules/order-history/
  - apps/web/src/features/order-history/
prisma: prisma/schema/order.prisma
updated: 2026-07-29
---
```

- `feature:` must match the code folder name exactly. That one field is the link between vault and repo.
- Link notes with `[[wikilinks]]`, not folders. Folders are only a rough bucket; the graph is the real structure.
- Every area has a MOC (`00-api-moc.md`) that links to its notes. A note not linked from any MOC is lost — fix it in the same commit.
- Use Dataview if installed: `TABLE feature, updated FROM #area/api SORT updated DESC` gives a live index, so you never maintain a list by hand.
- Orphan check: Obsidian's graph view, filter "no links" — do this weekly.

### PDFs
- Reference PDFs you read → `vault/attachments/`, embedded with `![[user-manual.pdf]]`.
- Generated PDFs → `storage/pdf/`, never committed, always dated so name-sort equals time-sort.
- The template that produced it keeps the same base name: `invoice.template.ts` → `invoice-1042_2026-07-29.pdf`.

---

## Checklist before creating a file

```
[ ] Correct case and suffix from the tables
[ ] Inside the right feature folder; name matches the other side
[ ] Test file next to it
[ ] New feature → created on BOTH web and api, same folder name
[ ] New model → singular PascalCase + @@map to snake_case plural
[ ] Migration created by `prisma migrate dev --name snake_case_verb_noun`
[ ] New note → frontmatter with feature + code paths, linked from its MOC
[ ] No spaces, no v2/final/copy, no non-ASCII
```

## Checklist for a rename

1. `git mv` so history is kept.
2. Rename the matching folder on the other side (web ↔ api).
3. Rename the vault note and update its `feature:` and `code:` fields.
4. In Obsidian, rename from inside the app so wikilinks update automatically.
5. Grep the old name across repo and vault.
6. Prisma model rename → change the model, keep `@@map` pointing at the old table unless you also write the migration for it.
