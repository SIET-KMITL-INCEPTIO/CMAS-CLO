# docs/ — versions and file families

Which file in `docs/` is current, which ones are older copies of it, and which
files only *look* related. Read this before opening anything in
`reference/db/` or `uml/` for a presentation.

Last checked: **2026-09-28**, against `database/schema.prisma` (13 models,
migrations `0001`–`0007`). When this page and the code disagree, the code wins.
Fix this page in the same change.

---

## 1. How versions are labelled

| Rule | Example |
|---|---|
| The **current** file keeps a stable name with no date | `mysql/index-q_er-diagram.pdf` |
| A replaced file moves to a `superseded/` folder next to it and gets the **date it was made** or its **version** as a suffix | `superseded/index-q_er-diagram_2026-09-13.pdf`, `superseded/cmas_app_mysql_v3.sql` |
| Every `superseded/` folder has a `README.md` with one row per file: what replaced it and why | [`reference/db/mysql/superseded/`](reference/db/mysql/superseded/README.md), [`uml/index-q/superseded/`](uml/index-q/superseded/README.md) |
| A markdown document carries its own version in its header, plus the baseline it was checked against | `> **Version:** 2.4.0 \| **Updated:** 2026-09-26` · `> **Baseline:** [[srs]] v2.4.0 · migration 0001–0007` |
| A generated file is never versioned by hand. Its version is the version of its input | `ER-INDEX-Q.*` ← `index-q.sql` |
| A `.drawio` in `uml/` drawn by hand (no script under `scripts/` writes it) ends in **`_Handwritten`**. A name without it means a script regenerates the file, so hand edits there will be overwritten. The one exception is `Structure.drawio`: page 1 is hand-drawn, pages 2–3 come from `build-structure-pages.py`, and the script finds the file by that name | `CMAS-FE-BE-DB_Handwritten.drawio` · `UML-INDEX-Q.drawio` (script) |

Nothing is deleted just because it is old. Older files move to `superseded/` so a
diagram shown in a past meeting still opens. v1/v2 of the MySQL schema are the
exception: they were deleted 2026-08-03 and live only in git history.

---

## 2. The schema lineage: two numbering schemes, one history

The same schema history is numbered **two different ways**, and the numbers do
not line up:

- `docs/markdown/sql/schema.md` numbers the **Prisma schema** (v2 … v5.1).
- The MySQL files in `reference/db/mysql/` carry their **own** number in the
  filename (`_v3`, `_v4`), which is one step off.

"v3" therefore means an 11-table schema in one place and a 13-table schema in
the other. **Use the migration number as the real key.** It is the one sequence
that cannot drift, because Prisma records it in the database.

| Migration (canonical) | Date | Tables | `schema.md` label | MySQL file label | MySQL file(s) | Status |
|---|---|---:|---|---|---|---|
| (before Prisma) | ≤ 2026-08-03 | 13 | — | v1 | deleted | git history only |
| (before Prisma) | ≤ 2026-08-03 | 15 | — | v2 (multi-tenant) | deleted | git history only |
| `0001`–`0002` | 2026-08-04 | 11 | v2 | **v3** | `superseded/cmas_app_mysql_v3.sql` · `superseded/cmas_app_production_v3.sql` + `.mwb` · `superseded/cmas_app_v3_er-diagram.pdf` | superseded |
| `0003`–`0004` | 2026-08-23, trimmed 2026-09-06 | 13 | v3 | **v4** | `cmas_app_mysql_v4.sql` · `cmas_app_v4.mwb` · `cmas_app_v4_er-diagram.pdf` (older 08-23 export in `superseded/`) | **frozen**: kept at top level because `build-er-tables-workbook.py`, `build-er-data-entry-workbook.py` and `check-diagrams.py` read it |
| `0005` | 2026-09-14 | 14 | v4 | — | no MySQL mirror | — |
| `0006` | 2026-09-17 | 13 | v5 | — | no MySQL mirror | — |
| `0007` | 2026-09-23 | 13 | **v5.1** | **`index-q`** | `index-q.sql` (13 Prisma tables + 4 proposed by the prototype = 17) · `index-q_er-diagram.pdf` | **current** |

If a new migration is added, add a row here and bump `schema.md`. Do not start
a `_v5` MySQL file: `index-q.sql` is the file that follows `schema.prisma`.

---

## 3. File families

Files that share a subject, grouped. **Versions** are the same artefact at
different times. **Siblings** are the same subject in different formats or from
different tools, all current together. **Look-alikes** share a name pattern but
are not versions of each other.

### 3.1 ER diagrams of the current model: siblings

Each one comes from `reference/db/mysql/index-q.sql`. They are current together,
so none replaces another.

| File | Made by | Use it to |
|---|---|---|
| `reference/db/mysql/index-q.sql` | hand-written | **source**: edit this |
| `uml/index-q/ER-INDEX-Q.drawio` | `scripts/build-er-index-q-drawio.py` | edit the layout |
| `uml/index-q/ER-INDEX-Q.html` | same script | open in a browser |
| `uml/index-q/ER-INDEX-Q.pdf` | Edge headless print of the `.html` | present or attach |
| `reference/db/mysql/index-q_er-diagram.pdf` | MySQL Workbench export, 2026-09-25 | show the Workbench-style EER (was the untracked `index-q-v2.pdf`) |

Older version: `reference/db/mysql/superseded/index-q_er-diagram_2026-09-13.pdf`
(was `index-q.pdf`: 15 tables, no `EmailVerificationToken`).

### 3.2 Frozen-at-v4 derivatives: versions that fall behind together

Built from `cmas_app_mysql_v4.sql`, so they describe migration `0004`, not the
current schema:

- `reference/db/mysql/cmas_app_v4.mwb`, `cmas_app_v4_er-diagram.pdf`
- `excel/CMAS-ER-Tables.xlsx` (`scripts/build-er-tables-workbook.py`)
- `excel/CMAS-ER-Data-Entry.xlsx` (`scripts/build-er-data-entry-workbook.py`)

They still have `ObjectiveAssessment` and `CLO.threshold`, and have no
`EmailVerificationToken` or `User.status`. To bring them current, point the two
scripts at `index-q.sql`.

### 3.3 Enterprise model: a separate lineage, not a version

`reference/db/enterprise/`: the full institutional design (36 tables:
curriculum versioning, PLO↔CLO mapping, sections, audit). The app does **not**
implement it; it is the reference shape if PLOs come into scope.

| File | Was | Dialect |
|---|---|---|
| `enterprise/schema.pg.sql` | `reference/db/schema.sql` | PostgreSQL 14+, the original |
| `enterprise/schema.mysql.sql` | `reference/db/mysql/cmas_enterprise_mysql.sql` | MySQL 8 translation of the file above |
| `enterprise/seed.pg.sql` | `reference/db/seed.sql` | seed data for the PostgreSQL file |

Moved 2026-09-28. The old name `schema.sql` read like the app's main schema;
`check-diagrams.py` warned about it.

### 3.4 Pre-Prisma migration scripts: historical

`reference/db/migrations/001-instructors-many-to-many.sql` and
`verify-courseinstructor.sql`: the MySQL-v1 → v3 move from
`Course.instructorId` to `CourseInstructor`. Now part of Prisma `0001_init`.
Kept for the reasoning in the comments. Not to be run.

### 3.5 Use case / UML diagrams: versions

| File | Status |
|---|---|
| `uml/index-q/UML-INDEX-Q.drawio` | **current**, generated by `scripts/build-index-q-uml-drawio.py` |
| `uml/index-q/index-q-usecase.drawio` | **current** sibling (same model, full UML 2.5 notation), `scripts/build-usecase-drawio.py` |
| `uml/index-q/superseded/UML-INDEX-Q_2026-09-14_Handwritten.drawio` | older hand-made copy, **not yet compared** for hand edits |
| `uml/CMAS/UML-Layer2_Handwritten.drawio` | use case numbering declared superseded by index-q (`STATUS:SUPERSEDED` line in `uml/CMAS/UML.md`) |
| `uml/CMAS/UML-Layer1_Handwritten.drawio`, `Structure.drawio` | current. Layer 1/2 are **levels of detail**, not versions |

### 3.6 Architecture diagrams: siblings, all drafts

In [`uml/CMAS/architecture/`](uml/CMAS/architecture/README.md) (moved from
`uml/index-q/superseded/` on 2026-09-28: none of them has a newer copy, so none
was superseded):

| File | What |
|---|---|
| `CMAS-Architecture_Handwritten.drawio` | 8 pages, code at commit `ff6ed7c` |
| `CMAS-FE-BE-DB_Handwritten.drawio` | 1 page, one request walked ①–⑩ |
| `CMAS-ARCH_Handwritten.drawio` | 1 page, stack in columns. Same subject as the file above |
| `CMAS-Flowcharts_Handwritten.drawio` | 49 flowcharts, one per use case |

### 3.7 Progress reports: one report, two variants

| File | Period | Format |
|---|---|---|
| `markdown/dev/progress/progress-report-02.md` | 4–7 Aug 2569 | standard sections |
| `markdown/dev/progress/progress-report-02-qa.md` | 4–8 Aug 2569 | §3 rewritten as question-and-answer |
| `markdown/dev/progress/progress-report-03.md` | 4 Aug – 21 Sep 2569 | standard, CLO 3 |

Report 2 exists twice. The `-qa` file covers one more day and reads as the
later rewrite. The repo does not record which one was submitted.

### 3.8 Look-alikes that are *not* versions

| Files | Why they are not versions |
|---|---|
| `markdown/graph/fishbone1.md` / `fishbone-4m.md` | Same problem, two analysis methods (5 Why vs 4M). Both current |
| `markdown/dev/planning/*.md` | Four different plans (project, sprint, mockup feedback, page restyle) |
| `excel/CMAS-ER-Data-Entry.xlsx` / `CMAS-TQF-Data-Entry.xlsx` | Same sample course, two views: ER tables vs TQF form |
| `word/CMAS-chapter-2-theory.docx` / `markdown/dev/thesis/theory.md` | The `.docx` is generated from the `.md` (`npm run thesis:ch2`) |

---

## 4. Document versions (markdown)

Each document keeps its own change notes in its header. This table only
indexes them. Bump the document's header first, then this row.

| Document | Version | Updated | Checked against |
|---|---|---|---|
| `dev/requirements/srs.md` | **2.4.2** | 2026-10-02 | `schema.prisma` 13 models |
| `dev/architecture/dev.md` | 2.1.0 | 2026-09-26 | — |
| `dev/architecture/dfd.md` | 2.6.0 | 2026-09-26 | SRS 2.4.0 · migration 0001–0007 |
| `dev/architecture/api-design.md` | 1.1.0 | 2026-09-26 | SRS 2.4.0 · migration 0001–0007 |
| `dev/ux/user-flow.md` | 1.1.1 | 2026-10-01 | SRS 2.4.0 |
| `dev/architecture/design-system.md` | 1.4.0 | — | — |
| `dev/thesis/thesis-toc.md` | 1.0.0 (Draft) | 2026-08-06 | — |
| `dev/requirements/objectives-hypotheses-evaluation.md` | 0.2.0 (Draft) | 2026-08-09 | ⚠ the body says "matches schema v5.1 as of 2026-09-26", but the header version and date were not bumped |
| `sql/schema.md` | schema **v5.1** | 2026-09-26 | migration 0001–0007 (see §2 for the numbering) |

Documents not listed have no version header.

---

## 5. Open questions (decide, then update this page)

1. ~~**Architecture drafts.**~~ Done 2026-09-28: moved to `uml/CMAS/architecture/`.
2. **`UML-INDEX-Q_2026-09-14_Handwritten.drawio`.** Compare it with the generated file. Then
   either carry its hand edits into the generator or delete it.
3. **Progress report 2.** Which of `-02` / `-02-qa` was submitted? Keep that one
   under the plain name and move the other to `progress/superseded/`.
4. **v4 Excel workbooks** (§3.2). Regenerate them from `index-q.sql`, or label
   them "frozen at 0004" inside the workbook.
5. **Two workbooks listed but not in the repo:** `excel/CMAS-ER-Diagram.xlsx`
   (`build-er-excel.py`) and `excel/CMAS-Score-Import-Template.xlsx`
   (`build-score-import-template.py`). Either run the scripts and commit the
   output, or drop the rows from `docs/README.md`.
