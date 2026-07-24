# CMAS — MySQL DDL for MySQL Workbench ER Diagrams

MySQL-dialect DDL scripts translated from the project's PostgreSQL/Prisma
sources, so MySQL Workbench can **reverse-engineer** them into EER (ER) diagrams.

| File | Model | Tables | Translated from |
|---|---|---|---|
| `cmas_enterprise_mysql.sql` | Full institutional design (curriculum versioning, PLO/CLO mapping, sections, enrollments, CLO/PLO attainment, field experience, audit) | 36 tables + 4 views | `../schema.sql` (PostgreSQL 14+) |
| `cmas_app_mysql.sql` | The schema the running app actually uses today | 12 tables | `../../../../database/schema.prisma` (Prisma) |

**Requires MySQL 8.0.16+** — uses `CHECK` constraints, expression column
defaults (`DEFAULT (CURRENT_DATE)`), and a `STORED` generated column
(`student_clo_scores.percent_score`). All tables are `InnoDB` + `utf8mb4` so the
Thai `_th` columns store correctly.

> Status: written to the MySQL 8 dialect but **not yet loaded against a live
> MySQL server** in this environment (no local MySQL / Docker daemon available).
> Run once against MySQL 8.0.16+ to confirm before relying on it in production.

---

## Option A — Reverse-engineer directly from the .sql script (no DB needed)

Best for just getting the diagram.

1. MySQL Workbench → **File ▸ Import ▸ Reverse Engineer MySQL Create Script…**
2. **Browse** to `cmas_enterprise_mysql.sql` (or `cmas_app_mysql.sql`).
3. Tick **"Place imported objects on a diagram"** → **Execute** → **Finish**.
4. An EER diagram opens with every table and all foreign-key relationship lines.
5. Tidy layout: **Arrange ▸ Autolayout**, then drag clusters apart.

## Option B — Reverse-engineer from a live database (round-trips data too)

1. Create the schema and load the DDL:
   ```bash
   mysql -u root -p -e "CREATE DATABASE cmas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u root -p cmas < cmas_enterprise_mysql.sql
   ```
2. Workbench → **Database ▸ Reverse Engineer…** (Ctrl+R) → pick the connection →
   select the `cmas` schema → **Next** through, then **Finish**.

## Export the diagram

**File ▸ Export ▸ Export as PNG / SVG / PDF…** (SVG scales best for docs).
To hand the model to someone else, save the Workbench model itself:
**File ▸ Save Model As…** → produces a `.mwb` file.

---

## What changed in translation (Postgres/Prisma → MySQL 8)

| Source | MySQL 8 |
|---|---|
| `BIGSERIAL` | `BIGINT AUTO_INCREMENT` |
| `@id @default(cuid())` (Prisma) | `VARCHAR(30)` PK (app-generated, no auto-increment) |
| `enum Role` (Prisma) | `ENUM('ADMIN','INSTRUCTOR')` |
| `TIMESTAMPTZ` + `now()` | `TIMESTAMP` / `DATETIME(3)` + `CURRENT_TIMESTAMP`; `updated_at` gets `ON UPDATE CURRENT_TIMESTAMP` |
| `TEXT` used in a `UNIQUE`/`PK` | `VARCHAR(n)` (MySQL can't index full `TEXT`) |
| `NUMERIC(p,s)` | `DECIMAL(p,s)` |
| `Float` (Prisma) | `DOUBLE` |
| `Boolean` | `TINYINT(1)` |
| `CHECK (x IN (...))` | kept (enforced on 8.0.16+, drawn by Workbench) |
| `GENERATED ALWAYS AS (…) STORED` | same syntax (MySQL 8) |
| `DEFAULT CURRENT_DATE` | `DEFAULT (CURRENT_DATE)` (expression default) |
| `CREATE EXTENSION pgcrypto` | removed (Postgres-only) |
| reserved words `order`, `role` | back-ticked |

### Fidelity caveats
- **Foreign keys are table-level constraints** (MySQL silently ignores inline
  column-level `REFERENCES`), which is what makes Workbench draw the relationship
  lines. Enterprise FKs default to `RESTRICT`; add `ON DELETE`/`ON UPDATE` rules
  if your app needs cascades.
- `plo_attainment_results.cohort_label` and any Postgres `TEXT` that sat inside a
  `UNIQUE` constraint became `VARCHAR`. `cohort_label` was nullable in Postgres;
  in MySQL it's `NOT NULL DEFAULT ''` so the unique key behaves the same
  (MySQL treats multiple NULLs as distinct, which would have broken the intended
  one-row-per-cohort rule).
- `ScoreUploadLog` (app schema) has **no** foreign keys — `courseId`/`uploadedBy`
  are plain strings in the Prisma model, so it renders as a standalone audit
  table. That matches the source; wire up FKs only if you decide to.
- On Linux MySQL, table-name case sensitivity is controlled by
  `lower_case_table_names`. The app schema uses mixed-case names
  (`User`, `Course`, …) exactly as Prisma emits them.

> These files are a **presentation/diagramming artifact**. The authoritative
> schema for the app remains `database/schema.prisma`; the authoritative
> full design remains `docs/markdown/sql/schema.sql` (PostgreSQL). Keep those
> as the source of truth and regenerate these if the models change.
