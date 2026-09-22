# CMAS — MySQL DDL for MySQL Workbench ER Diagrams

MySQL-dialect DDL scripts translated from the project's PostgreSQL/Prisma
sources, so MySQL Workbench can **reverse-engineer** them into EER (ER) diagrams.

The scripts live in [`reference/db/mysql/`](../../reference/db/mysql/) — they
are artifacts, not documentation, so they sit outside the markdown tree. All
filenames below are relative to that folder.

| File | Model | Tables | Purpose |
|---|---|---|---|
| [`cmas_app_mysql_v4.sql`](../../reference/db/mysql/cmas_app_mysql_v4.sql) | **v4 — current design.** Course-root + grading | 13 tables · 16 FKs | Diagramming only: tables + FKs, no triggers/views so Workbench imports cleanly. **Import this one** |
| [`index-q.sql`](../../reference/db/mysql/index-q.sql) | **v4 + what the UI prototype `docs/pages/index-q.html` adds** | 15 tables · 19 FKs | Same 13 tables copied verbatim from v4, plus the proposed `AuthEvent` (UC 1.6) and `UploadReject` (FR-65), three password-flow columns on `User`, and `ScoreUploadLog.kind` (`SCORE` / `ROSTER` — the prototype logs roster imports in the same table, added 2026-09-13). Every addition is tagged `[index-q]` in its COMMENT, so the EER diagram shows what is proposed. Import this to see the prototype's data model |
| [`cmas_app_mysql_v3.sql`](../../reference/db/mysql/cmas_app_mysql_v3.sql) | ~~v3~~ — **superseded**, no grading tables | 11 tables · 14 FKs | Kept for history only |
| [`cmas_app_production_v3.sql`](../../reference/db/mysql/cmas_app_production_v3.sql) | **v3 — current design.** Same tables, hardened | 11 tables · 28 CHECKs · 6 triggers · 6 views | The executable DDL. Run this one |
| [`cmas_enterprise_mysql.sql`](../../reference/db/mysql/cmas_enterprise_mysql.sql) | Full institutional design (curriculum versioning, PLO/CLO mapping, sections, enrollments, PLO attainment, audit) | 36 tables + 4 views | Reference only — **not** what the app implements |

### Version history

v1 and v2 were **deleted** on 2026-08-03. Recover from git history if needed
(`git log -- docs/reference/db/mysql/`); the v2 `.mwb` / `.pdf` files were never
committed and are gone from the repo entirely.

| Version | Root entity | Tables | Why it was replaced |
|---|---|---|---|
| v1 | `Course`, single instructor per course | 13 | `Course.instructorId` allowed only one teacher, and it doubled as the section discriminator |
| v2 | `Institution` (multi-tenant) | 15 | The system is single-tenant — one faculty at KMITL — so `Institution` + `Membership` + the four tenant-integrity triggers were carrying no weight |
| **v3** | **`Course`** | **11** | Current. `Curriculum` / `CurriculumCourse` dropped too; their five load-bearing columns (`credits`, the three hour columns, `gradingType`) moved up onto `Course` |

> **PLO note:** v3 has no programme table, so there is nowhere to attach a
> Program Learning Outcome. If PLOs come into scope later, `cmas_enterprise_mysql.sql`
> is the reference model for the `plos` / `clo_plo_map` shape — but adding them
> to the app schema means creating a `Program` table and **backfilling**
> `Course.programId`, which is not a purely additive migration. This is recorded
> as known technical debt in the header of `cmas_app_production_v3.sql`.

**Requires MySQL 8.0.16+** — uses `CHECK` constraints, expression column
defaults (`DEFAULT (CURRENT_DATE)`), and a `STORED` generated column
(`student_clo_scores.percent_score`). All tables are `InnoDB` + `utf8mb4` so the
Thai `_th` columns store correctly.

> **Loaded against a live MySQL 8.0.43 on 2026-09-11** — `cmas_app_mysql_v4.sql`
> and `index-q.sql` only, each into a throwaway schema:
>
> | File | Tables | FKs | Also checked |
> |---|---:|---:|---|
> | `cmas_app_mysql_v4.sql` | 13 | 16 | — |
> | `index-q.sql` | 15 | 19 | runs top-to-bottom with `FOREIGN_KEY_CHECKS = 1` · 11 of its tables are byte-identical to v4 by `SHOW CREATE TABLE`; `CourseInstructor` differs only in its COMMENT and `User` only by the 3 added columns · moving `AuthEvent` above `User` makes it fail with ERROR 1824, so the ordering claim is real |
>
> **Re-verified 2026-09-13** — `index-q.sql` loaded into a throwaway MySQL 8.0.43
> (`mysqld --no-defaults --initialize-insecure`, scratch datadir, port 33999 —
> never the installed server): **15 tables · 19 FKs** by `information_schema`,
> both `AuthEvent → User` FKs present, Thai `COMMENT` stored as correct UTF-8
> (checked by `HEX()`; the `????` a Windows console prints is display only).
> Table names come back lower-case there because Windows defaults to
> `lower_case_table_names=1` — a server setting, not a defect in the file;
> Workbench's *Reverse Engineer MySQL Create Script* reads the file and keeps
> the original case. Field-by-field against the `db` object in
> `docs/pages/index-q.html` (including runtime writes): every column the
> prototype stores exists in the SQL. Rendered diagram — no Workbench needed:
> `docs/uml/index-q/ER-INDEX-Q.pdf` to present, `ER-INDEX-Q.html` to open in a
> browser, `ER-INDEX-Q.drawio` to edit. All three come from
> `scripts/build-er-index-q-drawio.py` reading this file.
>
> The earlier row for v4 said "15 tables · 21 FKs" — that count predates the
> 2026-09-06 removal of `GradeScheme` and `GradeRun`. `cmas_app_production_v3.sql`
> has **not** been run against a server; confirm on MySQL 8.0.16+ before relying on it.
>
> Loading into a server verifies the DDL, not Workbench's own parser. Workbench
> reverse-engineers the script itself, so open it there once before handing it in.

---

## Option A — Reverse-engineer directly from the .sql script (no DB needed)

Best for just getting the diagram.

1. MySQL Workbench → **File ▸ Import ▸ Reverse Engineer MySQL Create Script…**
2. **Browse** to `cmas_app_mysql_v4.sql` — use the `_mysql_v4` file, never
   `cmas_app_production_v3.sql`: Workbench warns on that file's `DELIMITER`
   lines and skips its triggers and views.
3. Tick **"Place imported objects on a diagram"** → **Execute** → **Finish**.
4. An EER diagram opens with every table and all foreign-key relationship lines.
5. Tidy layout: **Arrange ▸ Autolayout**, then drag clusters apart.

## Option B — Reverse-engineer from a live database (round-trips data too)

1. Create the schema and load the DDL:
   ```bash
   mysql -u root -p -e "CREATE DATABASE cmas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u root -p cmas < cmas_app_production_v3.sql
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
- `ScoreUploadLog` **does** have real foreign keys as of v2 (`courseId` →
  `Course`, `uploadedBy` → `User`, the latter `RESTRICT` so an audit trail
  cannot lose its actor). The old note here said otherwise; that was true of v1
  only.
- v3 needs no deferred `ALTER TABLE`. v2 had one forward reference
  (`CurriculumCourse` → `Course`) that had to be added at the end of the file;
  with `Course` at the root every FK now points at a table already created
  above it, so both v3 files run top-to-bottom with `FOREIGN_KEY_CHECKS` on.
- On Linux MySQL, table-name case sensitivity is controlled by
  `lower_case_table_names`. The app schema uses mixed-case names
  (`User`, `Course`, …) exactly as Prisma emits them.

> These files are a **presentation/diagramming artifact**. The authoritative
> schema for the app remains `database/schema.prisma`; the authoritative
> full design remains `docs/reference/db/schema.sql` (PostgreSQL). Keep those
> as the source of truth and regenerate these if the models change.
