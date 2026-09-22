-- ============================================================================
-- 0003 — GRADING (การตัดเกรด อิงเกณฑ์ / อิงกลุ่ม) + CLO Bloom level & target
--
-- HAND-WRITTEN because no shadow database was available when this was authored.
-- Before applying to any shared environment, verify it matches what Prisma
-- would generate:
--
--   npx prisma migrate diff \
--     --from-migrations database/migrations \
--     --to-schema-datamodel database/schema.prisma \
--     --shadow-database-url "$SHADOW_DATABASE_URL" \
--     --script
--
-- The hand-written CHECKs and triggers for these tables are in 0004, following
-- the same split as 0001/0002. `prisma db push` deletes 0004 silently and is
-- still banned in every environment.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SECTION 1 — Rename GradingType -> GradeScale
--
-- `gradingType` (the output SCALE) and the new `gradingMethod` (HOW the cutoff
-- is computed) were one letter apart and meant different things. Renaming the
-- older one is cheaper now than a permanent reading hazard.
--
-- ALTER TYPE ... RENAME preserves the values, so no data migration is needed.
-- ----------------------------------------------------------------------------

ALTER TYPE "GradingType" RENAME TO "GradeScale";

ALTER TABLE "Course" RENAME COLUMN "gradingType" TO "gradeScale";

-- ----------------------------------------------------------------------------
-- SECTION 2 — New enums
-- ----------------------------------------------------------------------------

CREATE TYPE "GradingMethod" AS ENUM ('CRITERION_REFERENCED', 'NORM_REFERENCED');

-- No BoundaryUnit enum. The unit GradeBand.minValue is read in follows from the
-- method: percent for อิงเกณฑ์, T-score for อิงกลุ่ม. SD_MULTIPLE and PERCENTILE
-- were options nobody asked for, and each one added a branch to every screen and
-- every formula that reads a band.

CREATE TYPE "BloomLevel" AS ENUM (
    'REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'
);

-- ----------------------------------------------------------------------------
-- SECTION 3 — CLO gains a Bloom level and an optional per-CLO target
--
-- Both nullable. `bloomLevel` has no default on purpose: guessing REMEMBER for
-- every historical row would be worse than an honest NULL, because the whole
-- point of the column is checking that assessment matches cognitive level.
-- `classTarget` NULL means "inherit Course.classTarget" (CR-04).
-- ----------------------------------------------------------------------------

ALTER TABLE "CLO" ADD COLUMN "bloomLevel"  "BloomLevel";
ALTER TABLE "CLO" ADD COLUMN "classTarget" DOUBLE PRECISION;

-- ----------------------------------------------------------------------------
-- SECTION 3b — Course carries the grading method
--
-- อิงเกณฑ์ or อิงกลุ่ม, one per course. This single column is the entire grading
-- CONFIGURATION; everything else in this migration is data produced by it.
-- ----------------------------------------------------------------------------

ALTER TABLE "Course"
    ADD COLUMN "gradeMethod" "GradingMethod" NOT NULL DEFAULT 'CRITERION_REFERENCED';

-- ----------------------------------------------------------------------------
-- SECTION 4 — Grading tables
--
-- Two tables, nine columns. The ladder, and one row per student.
--
-- There is no GradeScheme (its two facts collapsed into Course.gradeMethod) and
-- no GradeRun. GradeRun froze n / mean / sd so a curved letter could be
-- re-derived later; without it the awarded letter is still permanent, because
-- StudentGrade.grade is stored rather than computed on read — but the arithmetic
-- behind a NORM_REFERENCED letter is no longer reproducible from the database
-- alone. That is the one guarantee this design gives up, knowingly. For
-- CRITERION_REFERENCED courses nothing is lost: GradeBand plus totalPercent
-- reproduces the letter exactly.
-- ----------------------------------------------------------------------------

-- CreateTable
-- Rank comes from `ORDER BY "minValue" DESC`; there is no `order` column to keep
-- in step with it, and no boundaryUnit — Course.gradeMethod says how to read it.
CREATE TABLE "GradeBand" (
    "id"       TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "grade"    TEXT NOT NULL,
    "minValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "GradeBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- No courseId: Student already carries it, and a grade belongs to an enrolment.
-- totalPercent is frozen here at grading time (CR-05) so that editing a raw score
-- afterwards cannot silently move a grade that was already awarded.
CREATE TABLE "StudentGrade" (
    "id"             TEXT NOT NULL,
    "studentId"      TEXT NOT NULL,
    "totalPercent"   DOUBLE PRECISION NOT NULL,
    "grade"          TEXT NOT NULL,
    "overrideReason" TEXT,

    CONSTRAINT "StudentGrade_pkey" PRIMARY KEY ("id")
);

-- ----------------------------------------------------------------------------
-- SECTION 5 — Indexes
-- ----------------------------------------------------------------------------

-- CreateIndex
CREATE UNIQUE INDEX "GradeBand_courseId_grade_key" ON "GradeBand"("courseId", "grade");

-- CreateIndex
-- Distinct cutoffs per course. This replaces the old monotonicity trigger: with
-- no two bands sharing a minValue, "the highest band the student clears" has
-- exactly one answer.
CREATE UNIQUE INDEX "GradeBand_courseId_minValue_key" ON "GradeBand"("courseId", "minValue");

-- CreateIndex
-- One enrolment, one grade.
CREATE UNIQUE INDEX "StudentGrade_studentId_key" ON "StudentGrade"("studentId");

-- ----------------------------------------------------------------------------
-- SECTION 6 — Foreign keys
--
-- Both CASCADE. Deleting a course takes its ladder with it; deleting an
-- enrolment takes that student's grade. Nothing here is referenced by anything
-- else, which is what makes the grading side cheap to change.
-- ----------------------------------------------------------------------------

ALTER TABLE "GradeBand" ADD CONSTRAINT "GradeBand_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
