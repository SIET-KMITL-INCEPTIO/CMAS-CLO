# superseded/

Files here are **outdated by a newer file in the parent folder** — they are
not deleted because a diagram once discussed in a meeting should still open
if someone asks "show me what we looked at on the 23rd", but they must never
be the one opened by mistake for a current presentation.

| File | Superseded by | Why |
|---|---|---|
| `cmas_app_v4_er-diagram_2026-08-23-stale.pdf` | `../cmas_app_v4_er-diagram.pdf` | Still shows `GradeScheme` / `GradeRun`, removed from the schema 2026-09-06 |
| `cmas_app_v4_2026-08-23-stale.mwb` | `../cmas_app_v4.mwb` | Same reason — the Workbench model behind the PDF above |
| `cmas_app_v3_er-diagram.pdf` | `../cmas_app_mysql_v4.sql` (re-import to regenerate) | The v3 (11-table, no grading) design — see `docs/markdown/sql/mysql-dumps.md` version history |

Verified 2026-09-13 by comparing extracted PDF text against
`database/schema.prisma`: the *-stale.pdf still names two tables the current
schema does not have.
