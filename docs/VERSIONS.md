# docs/ — versions and file families

Which file in `docs/` is current, which ones are older copies of it, and which
files only *look* related. Read this before opening anything in
`reference/db/` or `diagrams/` for a presentation.

Last checked: **2026-09-28**, against `database/schema.prisma` (13 models,
migrations `0001`–`0007`). When this page and the code disagree, the code wins.
Fix this page in the same change.

---

## 1. How versions are labelled

| Rule | Example |
|---|---|
| The **current** file keeps a stable name with no date | `mysql/index-q-er-diagram.pdf` |
| A replaced file moves to a `superseded/` folder next to it and gets the **date it was made** or its **version** as a suffix | `superseded/index-q_er-diagram_2026-09-13.pdf`, `superseded/cmas_app_mysql_v3.sql` |
| Every `superseded/` folder has a `README.md` with one row per file: what replaced it and why | [`reference/db/mysql/superseded/`](reference/db/mysql/superseded/README.md), [`diagrams/usecase/superseded/`](diagrams/usecase/superseded/README.md) |
| A markdown document carries its own version in its header, plus the baseline it was checked against | `> **Version:** 2.4.0 \| **Updated:** 2026-09-26` · `> **Baseline:** [[srs]] v2.4.0 · migration 0001–0007` |
| A generated file is never versioned by hand. Its version is the version of its input | `ER-INDEX-Q.*` ← `index-q.sql` |
| A `.drawio` in `diagrams/` drawn by hand (no script under `scripts/` writes it) ends in **`_Handwritten`**. A name without it means a script regenerates the file, so hand edits there will be overwritten. The one exception is `Structure.drawio`: hand-drawn, kept under its original name (its generated pages 2–3 were removed 2026-10-14) | `CMAS-FE-BE-DB_Handwritten.drawio` · `UML-INDEX-Q.drawio` (script) |

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
| `0003`–`0004` | 2026-08-23, trimmed 2026-09-06 | 13 | v3 | **v4** | `cmas_app_mysql_v4.sql` · `cmas_app_v4.mwb` · `cmas_app_v4_er-diagram.pdf` (older 08-23 export in `superseded/`) | **frozen**: kept at top level as the Workbench model; `check-diagrams.py` ER-1 compares it and only warns |
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
so none replaces another. The three `diagrams/er/ER-INDEX-Q.*` files were
regenerated 2026-10-02 from the 17-table SQL (ScoreChange added; its link to
`User` runs on a bus under the tables because the two sit three columns apart).

`index-q.sql` was checked against the prototype on 2026-10-02 in two ways: the
script was run top to bottom on a scratch MySQL 8.0.43 server (17 tables, 23
foreign keys, 11 columns tagged `[index-q]`, sample rows inserted into every
proposed table and column), and its columns were compared with the fields of
the live `db` object of `index-q.html`. Every name that differs on purpose is
listed in the header of the SQL file under "PROTOTYPE <-> SQL".

| File | Made by | Use it to |
|---|---|---|
| `reference/db/mysql/index-q.sql` | hand-written | **source**: edit this |
| `diagrams/er/ER-INDEX-Q.drawio` | `scripts/build-er-index-q-drawio.py` | edit the layout |
| `reference/db/mysql/index-q-v2.mwb` | `scripts/build-index-q-workbench.py` (needs MySQL Workbench) | Workbench model of `index-q.sql` · 18 tables, 26 relationships |
| `reference/db/mysql/index-q-er-diagram.pdf` | MySQL Workbench export of the model above, 2026-10-19 | show the Workbench-style EER (replaces `index-q_er-diagram.pdf` of 2026-09-25, which had 16 tables) |

Older version: `reference/db/mysql/superseded/index-q_er-diagram_2026-09-13.pdf`
(was `index-q.pdf`: 15 tables, no `EmailVerificationToken`).

### 3.2 Frozen-at-v4 derivatives: versions that fall behind together

Built from `cmas_app_mysql_v4.sql`, so they describe migration `0004`, not the
current schema:

- `reference/db/mysql/cmas_app_v4.mwb`, `cmas_app_v4_er-diagram.pdf`

They still have `ObjectiveAssessment` and `CLO.threshold`, and have no
`EmailVerificationToken` or `User.status`. Use `diagrams/er/ER-INDEX-Q.*` for the
current model. The two Excel workbooks generated from v4 (`CMAS-ER-Tables.xlsx`,
`CMAS-ER-Data-Entry.xlsx`) and their scripts were removed 2026-10-14; they are in
git history.

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
| `diagrams/usecase/index-q-usecase.drawio` | **official** use case diagram (UML 2.5, from `PERM`), `scripts/build-usecase-drawio.py` |
| `diagrams/usecase/UML-INDEX-Q.drawio` | current one-page summary of the same model, `scripts/build-index-q-uml-drawio.py` |
| `diagrams/usecase/superseded/UML-INDEX-Q_2026-09-14_Handwritten.drawio` | older hand-made copy, **not yet compared** for hand edits |
| `diagrams/usecase/UML-Layer2_Handwritten.drawio` | use case numbering declared superseded by index-q (`STATUS:SUPERSEDED` line in `diagrams/usecase/UML.md`) |
| `diagrams/usecase/UML-Layer1_Handwritten.drawio`, `Structure.drawio` | current. Layer 1/2 are **levels of detail**, not versions |

### 3.6 Architecture diagrams: siblings, all drafts

In [`diagrams/architecture/`](diagrams/architecture/README.md) (moved from
`uml/index-q/superseded/` on 2026-09-28: none of them has a newer copy, so none
was superseded):

| File | What |
|---|---|
| `CMAS-Architecture_Handwritten.drawio` | 8 pages, code at commit `ff6ed7c` |
| `CMAS-FE-BE-DB_Handwritten.drawio` | 1 page, one request walked ①–⑩ |
| `CMAS-ARCH_Handwritten.drawio` | 1 page, stack in columns. Same subject as the file above |
| `CMAS-Flowcharts_Handwritten.drawio` | 50 flowcharts, one per use case (5.7 added 2026-10-19; 4.2 · 5.4 · 8.1 updated to the prototype) |

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
| `word/CMAS-chapter-2-theory.docx` / `markdown/dev/thesis/theory.md` | The `.docx` is generated from the `.md` (`npm run thesis:ch2`) |

---

### 3.9 Threat model: one model, one report

In [`diagrams/threat-model/`](diagrams/threat-model/). Checked 2026-10-20 against
`diagrams/dfd/DFD-INDEX-Q.drawio` v1.4. DFD v1.4 (2026-10-19) changes labels only — `RemediationPlan` joins D5, "แผนพัฒนาผู้เรียน" and "บันทึกการตั้งค่าตัดเกรด" join existing flows; still 6 processes, 6 stores, 44 flows — so the threat model needs no new element, only the label wording. The model was relabelled on 2026-10-19 (the 6.0 ↔ D2 grading flows and ผู้สอน → 6.0 carry the new words); **still old wording:** the 6.0 ↔ D5 and 6.1 ↔ D5 flows, which do not yet mention แผนพัฒนาผู้เรียน.

| File | Status |
|---|---|
| `threat-model.tm7` | **current**, edited by hand in Microsoft Threat Modeling Tool. Four pages (`Layer0`, `Layer1`, `Layer2-P4`, `Layer2-P6`) that mirror DFD levels 0, 1 and the two level-2 pages |
| `report.htm` | **current**, exported from the model above: 695 threats. Every threat is still *Not Started* / *High* (the tool's default): not yet assessed |
| `superseded/` | four older reports and the checklist used to fix the model, see the README there |

The model is **not generated** from the DFD, so `check-diagrams.py` does not compare
them: when the DFD changes, redraw the model by hand and export a new report.
Overwrite `threat-model.tm7` and `report.htm` in place; earlier states of both are
in git history, and an older report that is still worth keeping moves to
`superseded/` with its date.

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
5. **Two workbooks listed but not in the repo:** `excel/data-model/CMAS-ER-Diagram.xlsx`
   (`build-er-excel.py`) and `excel/import-test/CMAS-Score-Import-Template.xlsx`
   (`build-score-import-template.py`). Either run the scripts and commit the
   output, or drop the rows from `docs/README.md`.
