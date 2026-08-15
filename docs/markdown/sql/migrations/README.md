# docs/markdown/sql/migrations — historical only

**The live migrations are `database/migrations/`.** Nothing in this folder is
applied by `prisma migrate deploy`.

## What is here

| File | Status |
|---|---|
| `001-instructors-many-to-many.sql` | **Historical.** Written to migrate a live database from `Course.instructorId` to the `CourseInstructor` junction table. No database in that shape exists anywhere any more — the change is baked into `database/migrations/0001_init/migration.sql`. Kept for the reasoning in its comments, not to be run. |
| `verify-courseinstructor.sql` | Verification queries for the above. Still useful as ad-hoc SQL; not part of any pipeline. |

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

## Where the hand-written DDL actually lives

`database/migrations/0002_constraints_and_triggers/migration.sql` — the CHECK
constraints, the `uq_courseinstructor_lead` partial index, and the integrity
triggers, including the four tenant-integrity triggers. Prisma replays it but
never regenerates it.

`prisma db push` deletes all of it silently. **db push is banned in every
environment, including local.**
