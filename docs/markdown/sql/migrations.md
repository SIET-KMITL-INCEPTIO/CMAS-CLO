# Historical migrations — reference only

**The live migrations are `database/migrations/`.** Nothing described on this
page is applied by `prisma migrate deploy`.

## What is here

The scripts themselves live in
[`reference/db/migrations/`](../../reference/db/migrations/) — they are
artifacts, not documentation, so they sit outside the markdown tree.

| File | Status |
|---|---|
| [`001-instructors-many-to-many.sql`](../../reference/db/migrations/001-instructors-many-to-many.sql) | **Historical.** Written to migrate a live database from `Course.instructorId` to the `CourseInstructor` junction table. No database in that shape exists anywhere any more — the change is baked into `database/migrations/0001_init/migration.sql`. Kept for the reasoning in its comments, not to be run. |
| [`verify-courseinstructor.sql`](../../reference/db/migrations/verify-courseinstructor.sql) | Verification queries for the above. Still useful as ad-hoc SQL; not part of any pipeline. |

## Do not write a `002-multi-tenancy.sql` here

The multi-institution change (Institution, Membership, `institutionId` FKs,
reworked unique keys) is **not** in this folder, and that is deliberate.

`001` exists because there was a live database with real rows that had to be
transformed in place. There is no such database. The schema had never been
migrated when multi-tenancy landed — no `database/migrations/` directory
existed and the only data was seed data — so the correct move was to fold the
whole thing into the baseline `0001_init` rather than to ship a baseline plus a
migration off it. One migration, one review, one mental model.

Adding a hand-written `002` here "for consistency" would create a second,
divergent source of truth for DDL that Prisma already owns.

## Live migrations — `database/migrations/` (as of 2026-09-26)

| Migration | Date | What it does | Hand-written |
|---|---|---|---|
| `0001_init` | — | Baseline schema (Prisma-generated, single-tenant since 2026-08-04) | no |
| `0002_constraints_and_triggers` | — | 28 CHECKs · partial index `uq_courseinstructor_lead` · triggers (`trg_score_validate`, `trg_criteria_same_course`, `trg_objassess_same_clo`) | **yes** |
| `0003_grading_and_clo_bloom` | 2026-08-23 (แก้ 2026-09-06) | `GradeBand` · `StudentGrade` · `CLO.bloomLevel` / `classTarget` · `Course.gradeMethod` · `gradingType` → `gradeScale` | **yes** |
| `0004_grading_constraints_and_triggers` | 2026-08-23 (แก้ 2026-09-06) | 7 CHECKs · trigger `gradeband_passfail` for the grading tables | **yes** |
| `0005_single_course_role_solo_and_self_registration` | 2026-09-14 | Drops `CourseRole` + `uq_courseinstructor_lead` (D1) · `CLO.soloLevel` (D4) · `EmailVerificationToken` · `User.passwordHash` nullable, `authProvider`, `googleSub`, `emailVerifiedAt` (D6) · `classTarget` default 70 → 100 (D2) | **yes** |
| `0006_clo_objective_activity_hierarchy` | 2026-09-17 | Drops `ObjectiveAssessment` and `CLO.threshold` · `AssessmentCriteria` re-keyed to `objectiveId` · `Course.cloPassMark` (average of the old thresholds) · `CLO.weight` · `BehavioralObjective.weight` · `Activity.type` / `assessmentMethod` / `criteriaNote` / `passMark` (drops `method`) | **yes** |
| `0007_google_domain_account_status` | 2026-09-23 | `AccountStatus` enum · `User.status` (default `ACTIVE`) · index `User_status_idx` (FR-08) | **yes** |

**Caveat, stated plainly:** `0002`–`0007` are hand-written, and each header says to compare them with
`prisma migrate diff --from-migrations … --to-schema-datamodel …` against a shadow database before applying
anywhere shared. **No note in the repo records that this was done** — until it is, treat migrations 0003–0007 as reviewed
but not replayed.

Still **not** in any migration (the `index-q.html` prototype uses them): `AuthEvent` · `UploadReject` · `CourseGroupWeight` ·
`Course.weightMode` · `Activity.passScore` · `User.mustChangePassword` / `pwResetAt` / `pwChangedAt` · `ScoreUploadLog.kind`.
They are the candidate content of a future `0008`; see [mysql-dumps.md](./mysql-dumps.md).

## Where the hand-written DDL actually lives

`database/migrations/0002_constraints_and_triggers/migration.sql` — the CHECK
constraints and integrity triggers (the tenant-integrity triggers and the
`uq_courseinstructor_lead` partial index it once held are gone: single-tenant
removed the first, migration `0005` dropped the second). `0004` adds the grading
CHECKs and the `gradeband_passfail` trigger; `0005` and `0006` add more CHECKs
and rewrite `trg_criteria_same_course`. Prisma replays them but never regenerates them.

`prisma db push` deletes all of it silently. **db push is banned in every
environment, including local.**
