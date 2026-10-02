# superseded/

Files here are **outdated by a newer file in the parent folder** — they are
not deleted because a diagram once discussed in a meeting should still open
if someone asks "show me what we looked at on the 23rd", but they must never
be the one opened by mistake for a current presentation.

Naming: the current file keeps a stable name in `../`; the file it replaced
moves here with the date it was made (`_YYYY-MM-DD`) or its version (`_v3`).
The full lineage is in [`docs/VERSIONS.md`](../../../../VERSIONS.md).

| File | Superseded by | Why |
|---|---|---|
| `index-q_er-diagram_2026-09-13.pdf` | `../index-q_er-diagram.pdf` (Workbench export 2026-09-25) | Was `index-q.pdf`. Drawn when `index-q.sql` had 15 tables. It lacks `EmailVerificationToken` (migration 0005), which the 2026-09-25 export has |
| `cmas_app_v4_er-diagram_2026-08-23-stale.pdf` | `../cmas_app_v4_er-diagram.pdf` | Still shows `GradeScheme` / `GradeRun`, removed from the schema 2026-09-06 |
| `cmas_app_v4_2026-08-23-stale.mwb` | `../cmas_app_v4.mwb` | Same reason — the Workbench model behind the PDF above |
| `cmas_app_v3_er-diagram.pdf` | `../cmas_app_mysql_v4.sql` (re-import to regenerate) | The v3 (11-table, no grading) design — see `docs/markdown/sql/mysql-dumps.md` version history |
| `cmas_app_mysql_v3.sql` | `../index-q.sql` | v3 diagramming mirror (11 tables, no grading). Moved here 2026-09-28; before that it sat next to v4 and `check-diagrams.py` warned about it |
| `cmas_app_production_v3.sql` | `../index-q.sql` | The v3 tables with 28 CHECKs, 6 triggers and 6 views. Still the only MySQL file with that hardening, so it is the model for hardening a later version. Moved 2026-09-28 |
| `cmas_app_production_v3.mwb` | `../cmas_app_v4.mwb` | Workbench model of the file above. Moved 2026-09-28 |

Verified 2026-09-13 by comparing extracted PDF text against
`database/schema.prisma`: the *-stale.pdf still names two tables the current
schema does not have. The `index-q` PDFs were compared the same way on
2026-09-28 (PDF metadata `CreationDate` 2026-09-13 vs 2026-09-25).
