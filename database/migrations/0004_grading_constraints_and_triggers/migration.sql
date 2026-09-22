-- ============================================================================
-- 0004 — HAND-WRITTEN. Prisma did not generate this and must never rewrite it.
--
-- Same two classes of rule as 0002, for the grading tables added in 0003:
--   1. CHECK constraints
--   2. Cross-table triggers (Postgres forbids subqueries in CHECK)
--
-- `prisma db push` deletes all of this silently. db push stays banned in EVERY
-- environment, including local. Use `prisma migrate dev`.
--
-- ----------------------------------------------------------------------------
-- WHY THIS FILE IS SHORT (2026-09-06)
--
-- It used to hold eleven CHECKs and six triggers for four grading tables. The
-- grading side is now two tables and nine columns, and most of what was enforced
-- here disappeared with the columns it was reconciling rather than being
-- relaxed:
--
--   monotonic bands       -> UNIQUE ("courseId", "minValue") in 0003
--   order >= 0            -> no `order` column
--   version >= 1          -> no `version` column
--   published has a date  -> no `status` column, only the date
--   minScore <= maxScore  -> neither column exists
--   grade stays in course -> StudentGrade hangs off Student, which already
--                            carries courseId, so there is no second path to
--                            disagree with
--   run is frozen         -> no GradeRun; see the note at the end of this file
--
-- What is left are the rules that are still about live columns.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SECTION 1 — CHECK constraints
-- ----------------------------------------------------------------------------

ALTER TABLE "CLO"
    ADD CONSTRAINT chk_clo_classtarget
        CHECK ("classTarget" IS NULL OR ("classTarget" >= 0 AND "classTarget" <= 100));

ALTER TABLE "GradeBand"
    ADD CONSTRAINT chk_gradeband_grade_not_blank
        CHECK (length(btrim("grade")) > 0),
    -- A negative cutoff cannot be cleared meaningfully in either unit.
    ADD CONSTRAINT chk_gradeband_minvalue
        CHECK ("minValue" >= 0);

ALTER TABLE "StudentGrade"
    ADD CONSTRAINT chk_studentgrade_totalpercent
        CHECK ("totalPercent" >= 0 AND "totalPercent" <= 100),
    ADD CONSTRAINT chk_studentgrade_grade_not_blank
        CHECK (length(btrim("grade")) > 0),
    -- An override is recorded ONLY as its reason, so a blank string would be an
    -- unexplained grade change wearing the costume of an explained one.
    ADD CONSTRAINT chk_studentgrade_override_reason
        CHECK ("overrideReason" IS NULL OR length(btrim("overrideReason")) > 0);

-- ----------------------------------------------------------------------------
-- SECTION 2 — PASS_FAIL courses
--
-- CR-06: a PASS_FAIL course reports ผ่าน (S) / ไม่ผ่าน (U) only.
--   2a. its bands may only be 'S' or 'U'
--   2b. it may not be graded อิงกลุ่ม at all — S/U is decided against
--       Course.passCriteria, and curving a two-value scale is meaningless
--
-- 2b is a single-row rule now that the method lives on Course, so it is a CHECK
-- rather than the trigger it needed when the method sat on GradeScheme.
-- ----------------------------------------------------------------------------

ALTER TABLE "Course"
    ADD CONSTRAINT chk_course_passfail_not_norm
        CHECK ("gradeScale" <> 'PASS_FAIL' OR "gradeMethod" = 'CRITERION_REFERENCED');

CREATE OR REPLACE FUNCTION trg_gradeband_passfail()
RETURNS TRIGGER AS $$
DECLARE
    v_scale "GradeScale";
BEGIN
    SELECT c."gradeScale" INTO v_scale
    FROM "Course" c WHERE c."id" = NEW."courseId";

    IF v_scale = 'PASS_FAIL' AND NEW."grade" NOT IN ('S', 'U') THEN
        RAISE EXCEPTION
            'วิชาแบบ PASS_FAIL กำหนดเกรดได้เฉพาะ S / U เท่านั้น ไม่ใช่ % (CR-06 / FR-86)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gradeband_passfail
    BEFORE INSERT OR UPDATE ON "GradeBand"
    FOR EACH ROW EXECUTE FUNCTION trg_gradeband_passfail();

-- ----------------------------------------------------------------------------
-- SECTION 3 — RULES THAT ARE NO LONGER ENFORCED HERE
--
-- Two things this file used to guarantee now live in the app. Both are listed
-- rather than quietly dropped, because a rule that moved is easy to forget and
-- the database can no longer catch either one.
--
-- 1. อิงกลุ่ม needs a usable spread (CR-10 / FR-94)
--    T = 50 + 10 x (x - mean) / SD divides by SD, so SD = 0 or n < 2 must be
--    refused. There is no GradeRun row to attach that check to any more; the
--    grading service checks it before it writes any StudentGrade row, and the
--    soft "n below MIN_SAMPLE_SIZE" warning was always app-level.
--
-- 2. A published run is frozen (CR-11 / FR-96)
--    There is no run to freeze. What replaces it is narrower but not nothing:
--    StudentGrade.grade and .totalPercent are STORED, so a grade already awarded
--    cannot drift when a student withdraws or a score is edited — the row simply
--    stays as written. What is gone is the ability to re-derive a curved letter
--    from the database alone, because n / mean / sd are no longer kept.
--
--    If that auditability is wanted back, add ONE table (courseId, n, mean, sd,
--    computedAt) and a nullable FK from StudentGrade. Do not bring back
--    GradeScheme, GradeRunStatus, or the version column with it.
--
-- 3. The mandatory floor band (a grade at minValue = 0, so no score falls
--    through the ladder) is an app-level rule under CR-09 and never was a
--    trigger here, despite an old comment in schema.prisma that said it was.
-- ----------------------------------------------------------------------------
