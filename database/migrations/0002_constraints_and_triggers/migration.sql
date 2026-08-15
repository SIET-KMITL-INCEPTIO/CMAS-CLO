-- ============================================================================
-- HAND-WRITTEN. Prisma did not generate this and must never rewrite it.
--
-- These are the three classes of constraint the Prisma schema language cannot
-- express, listed in database/schema.prisma's header:
--   1. CHECK constraints
--   2. Cross-table triggers (Postgres, like MySQL, forbids subqueries in CHECK)
--   3. "at most one LEAD per course" — a partial unique index
--
-- SINGLE-TENANT (2026-08-04, task 2.7). The four TENANT-INTEGRITY triggers that
-- used to live in section 4 are gone along with Institution/Membership/
-- Curriculum/CurriculumCourse. They guarded institution references that no
-- WHERE clause could catch; with one faculty there is no boundary left to
-- cross, and a trigger that can never fire is a lie in the schema. The
-- same-course triggers below are the ones that still do real work.
--
-- `prisma db push` deletes all of this silently. db push is banned in EVERY
-- environment, including local. Use `prisma migrate dev`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SECTION 1 — CHECK constraints
-- ----------------------------------------------------------------------------

ALTER TABLE "User"
    ADD CONSTRAINT chk_user_email CHECK (email LIKE '%_@_%.__%'),
    ADD CONSTRAINT chk_user_name  CHECK (length(btrim(name)) > 0),
    ADD CONSTRAINT chk_user_hash  CHECK (length("passwordHash") >= 20);

ALTER TABLE "Course"
    -- Coarse band at the DB, the real bound (1..3) in Zod — NFR-12's split:
    -- the DB holds the invariant, the API holds the readable message.
    ADD CONSTRAINT chk_course_semester CHECK (semester BETWEEN 1 AND 6),
    -- Wide enough to accept พ.ศ. (2568). The faculty writes one era; see the
    -- schema header.
    ADD CONSTRAINT chk_course_year     CHECK (year BETWEEN 1900 AND 2700),
    ADD CONSTRAINT chk_course_code     CHECK (length(btrim(code)) > 0),
    ADD CONSTRAINT chk_course_name     CHECK (length(btrim(name)) > 0),
    ADD CONSTRAINT chk_course_section  CHECK (length(btrim(section)) > 0),
    -- Absorbed from CurriculumCourse. The floor is 0, not 1: 90641008 is a real
    -- 0 (0-0-45) prerequisite (FR-14).
    ADD CONSTRAINT chk_course_credits  CHECK (credits BETWEEN 0 AND 30),
    ADD CONSTRAINT chk_course_hours
        CHECK ("lectureHours" >= 0 AND "practiceHours" >= 0 AND "selfStudyHours" >= 0),
    -- OI-03. CR-05 divides by neither but compares against both, and a value
    -- outside 0-100 silently inverts every pass/fail verdict.
    ADD CONSTRAINT chk_course_pass_criteria
        CHECK ("passCriteria" >= 0 AND "passCriteria" <= 100),
    ADD CONSTRAINT chk_course_class_target
        CHECK ("classTarget" >= 0 AND "classTarget" <= 100);

ALTER TABLE "CLO"
    ADD CONSTRAINT chk_clo_number      CHECK (number > 0),
    ADD CONSTRAINT chk_clo_threshold   CHECK (threshold >= 0 AND threshold <= 100),
    ADD CONSTRAINT chk_clo_description CHECK (length(btrim(description)) > 0);

ALTER TABLE "BehavioralObjective"
    ADD CONSTRAINT chk_behavioral_number      CHECK (number > 0),
    ADD CONSTRAINT chk_behavioral_description CHECK (length(btrim(description)) > 0);

ALTER TABLE "Activity"
    -- maxScore > 0 is load-bearing: every formula in SRS §3 divides by it.
    ADD CONSTRAINT chk_activity_maxscore CHECK ("maxScore" > 0),
    ADD CONSTRAINT chk_activity_weight   CHECK (weight >= 0 AND weight <= 100),
    ADD CONSTRAINT chk_activity_order    CHECK ("order" >= 0),
    ADD CONSTRAINT chk_activity_name     CHECK (length(btrim(name)) > 0);

ALTER TABLE "AssessmentCriteria"
    ADD CONSTRAINT chk_criteria_weight CHECK (weight > 0 AND weight <= 100);

ALTER TABLE "Student"
    ADD CONSTRAINT chk_student_code CHECK (length(btrim("studentCode")) > 0),
    ADD CONSTRAINT chk_student_name CHECK (length(btrim(name)) > 0);

ALTER TABLE "Score"
    ADD CONSTRAINT chk_score_non_negative CHECK (score >= 0);

ALTER TABLE "ScoreUploadLog"
    ADD CONSTRAINT chk_uploadlog_ok   CHECK ("recordsOk" >= 0),
    ADD CONSTRAINT chk_uploadlog_fail CHECK ("recordsFail" >= 0),
    ADD CONSTRAINT chk_uploadlog_file CHECK (length(btrim("fileName")) > 0);

-- ----------------------------------------------------------------------------
-- SECTION 2 — Partial unique index (DC-07)
--
-- At most one LEAD per course. MySQL needed a generated `leadKey` column for
-- this; Postgres expresses it directly.
--
-- "At LEAST one LEAD" is deliberately NOT enforced here: the course row must
-- exist before anyone can be assigned to it, so the first insert would be
-- impossible. FR-23 enforces that half in the application layer.
-- ----------------------------------------------------------------------------

CREATE UNIQUE INDEX uq_courseinstructor_lead
    ON "CourseInstructor" ("courseId")
    WHERE role = 'LEAD';

-- ----------------------------------------------------------------------------
-- SECTION 3 — Integrity triggers (DC-01, DC-04, DC-05, DC-06)
--
-- All three are same-course / same-CLO rules. They are the last line of defence
-- for NFR-07 now that the tenant guard is gone: course scope is the ONLY
-- boundary left, so nothing may silently link across courses.
-- ----------------------------------------------------------------------------

-- DC-01 + DC-05: score <= the activity's maxScore, and the student and the
-- activity must belong to the same course.
CREATE OR REPLACE FUNCTION trg_score_validate() RETURNS trigger AS $$
DECLARE
    v_max_score   DOUBLE PRECISION;
    v_act_course  TEXT;
    v_stu_course  TEXT;
BEGIN
    SELECT "maxScore", "courseId" INTO v_max_score, v_act_course
        FROM "Activity" WHERE id = NEW."activityId";
    SELECT "courseId" INTO v_stu_course
        FROM "Student" WHERE id = NEW."studentId";

    IF NEW.score > v_max_score THEN
        RAISE EXCEPTION 'Score % exceeds the activity maximum of %', NEW.score, v_max_score;
    END IF;

    IF v_act_course IS DISTINCT FROM v_stu_course THEN
        RAISE EXCEPTION 'Student and Activity belong to different courses';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_score_validate
    BEFORE INSERT OR UPDATE ON "Score"
    FOR EACH ROW EXECUTE FUNCTION trg_score_validate();

-- DC-04: the Activity and the CLO in one AssessmentCriteria row must belong to
-- the same course (FR-46). Every attainment number is computed by walking this
-- table, so a cross-course pairing corrupts a report rather than erroring.
CREATE OR REPLACE FUNCTION trg_criteria_same_course() RETURNS trigger AS $$
DECLARE
    v_activity_course TEXT;
    v_clo_course      TEXT;
BEGIN
    SELECT "courseId" INTO v_activity_course FROM "Activity" WHERE id = NEW."activityId";
    SELECT "courseId" INTO v_clo_course      FROM "CLO"      WHERE id = NEW."cloId";

    IF v_activity_course IS DISTINCT FROM v_clo_course THEN
        RAISE EXCEPTION 'Activity and CLO belong to different courses';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_criteria_same_course
    BEFORE INSERT OR UPDATE ON "AssessmentCriteria"
    FOR EACH ROW EXECUTE FUNCTION trg_criteria_same_course();

-- DC-06: a BehavioralObjective may only be attached to a criterion belonging to
-- its own CLO. Traceability must never silently cross CLOs (FR-35).
CREATE OR REPLACE FUNCTION trg_objassess_same_clo() RETURNS trigger AS $$
DECLARE
    v_criteria_clo  TEXT;
    v_objective_clo TEXT;
BEGIN
    SELECT "cloId" INTO v_criteria_clo
        FROM "AssessmentCriteria" WHERE id = NEW."criteriaId";
    SELECT "cloId" INTO v_objective_clo
        FROM "BehavioralObjective" WHERE id = NEW."objectiveId";

    IF v_criteria_clo IS DISTINCT FROM v_objective_clo THEN
        RAISE EXCEPTION 'Behavioral objective belongs to a different CLO than the criterion';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_objassess_same_clo
    BEFORE INSERT OR UPDATE ON "ObjectiveAssessment"
    FOR EACH ROW EXECUTE FUNCTION trg_objassess_same_clo();
