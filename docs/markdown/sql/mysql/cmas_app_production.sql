-- ============================================================================
-- CMAS / CLO SYSTEM — Application Schema — PRODUCTION DDL
-- Target: MySQL 8.0.16 or newer  (8.0.16+ is REQUIRED — CHECK constraints are
--         parsed but silently IGNORED on every version below that)
--
-- Relationship to the other files in this folder:
--   cmas_app_mysql.sql        = diagramming artifact (mirrors Prisma 1:1, no
--                               ON DELETE actions, no business-rule checks)
--   cmas_app_production.sql   = THIS FILE. Same 11 tables, but hardened for
--                               real use: cascade rules, CHECK constraints,
--                               missing UNIQUE keys, cross-table triggers,
--                               and reporting/audit views.
--
-- Source of truth for the app remains database/schema.prisma. This file ADDS
-- constraints Prisma does not express. See "PRISMA SYNC" notes at the bottom
-- before running prisma migrate / db push against this database.
--
-- ============================================================================
-- WHAT WAS FIXED vs cmas_app_mysql.sql
-- ----------------------------------------------------------------------------
-- 1.  CurriculumCourse had NO link to Course (courseCode was a bare string).
--     -> added nullable courseId FK. Nullable on purpose: a curriculum is a
--        PLAN and is drafted/cloned before any Course is actually opened.
-- 2.  Curriculum.clonedFrom pointed at a Curriculum id but had no FK.
--     -> added self-referencing FK, ON DELETE SET NULL.
-- 3.  ScoreUploadLog.courseId / uploadedBy were bare strings.
--     -> added real FKs.
-- 4.  No FK had ON DELETE/ON UPDATE actions (all silently RESTRICT).
--     -> owned children now CASCADE; people/audit references RESTRICT.
-- 5.  CLO.number was not unique per course (two "CLO 1" in one course).
--     -> added UNIQUE(courseId, number).
-- 6.  A curriculum could list the same course code twice.
--     -> added UNIQUE(curriculumId, courseCode).
-- 7.  No value validation at all: negative scores, maxScore = 0 (division by
--     zero in every attainment report), threshold = 5000%, credits = -3.
--     -> added CHECK constraints on every numeric/domain column.
-- 8.  CROSS-TABLE holes that CHECK cannot express (MySQL forbids subqueries in
--     CHECK), so they are enforced by triggers:
--       a. Score.score could exceed the Activity's maxScore.
--       b. A Score could join a Student of course A to an Activity of course B.
--       c. AssessmentCriteria could map an Activity of course A to a CLO of
--          course B — this silently corrupts every CLO attainment number.
-- 9.  Weight totals (Activity per course = 100, Criteria per activity = 100)
--     cannot be enforced per-row without blocking partial data entry.
--     -> exposed as audit VIEWS instead, so the app can flag them in the UI.
-- 10. Course.instructorId allowed exactly ONE teacher per course, so co-taught
--     lab/practicum subjects could not be represented at all.
--     -> replaced by the CourseInstructor junction (M:N) with a role column.
--     -> CAREFUL: instructorId was also part of uq_course_offering, where it
--        silently acted as the section discriminator. Removing it without
--        replacement would have reduced the key to (code, semester, year) and
--        permitted only one section of a course per term. A real `section`
--        column now carries that meaning explicitly.
-- 11. credits was INT with CHECK (1..30), which discarded the lecture/practice/
--     self-study breakdown the curriculum prints as "3 (2-2-5)" AND rejected
--     90641008 "0 (0-0-45)", a zero-credit prerequisite that really exists.
--     -> DECIMAL(3,1) + three hour columns + gradingType (LETTER / PASS_FAIL),
--        floor lowered to 0.
-- 12. BehavioralObjective was a dead end — nothing referenced it, so the
--     system could state an objective but never show where it was measured.
--     -> objectives are now numbered per CLO, and ObjectiveAssessment links
--        them to the criteria that provide the evidence.
--
-- SCOPE: fixes 11-12 come from checking this schema against the real document
-- "หลักสูตร ค.อ.บ. สาขาวิชาเทคโนโลยีคอมพิวเตอร์ (ปรับปรุง พ.ศ. 2567)".
--
-- This schema stops at the COURSE level. The unit of analysis is the CLO and
-- its behavioural objectives — that is the project's topic. Everything above
-- a course belongs to the institutional model in cmas_enterprise_mysql.sql and
-- is deliberately absent here:
--   PLO and CLO->PLO roll-up · course prerequisites ·
--   หมวดวิชา/กลุ่มวิชา category hierarchy · faculty/department structure ·
--   curriculum version workflow
-- ============================================================================

SET NAMES utf8mb4;

-- MySQL 8 defaults, with STRICT_TRANS_TABLES upgraded to STRICT_ALL_TABLES so
-- bad data is rejected rather than silently coerced (an over-long VARCHAR or an
-- invalid DATETIME would otherwise be truncated and written anyway).
-- ONLY_FULL_GROUP_BY is kept deliberately: the attainment views below depend on
-- correct grouping, and dropping it would let malformed aggregates return
-- arbitrary rows instead of erroring.
SET SESSION sql_mode = CONCAT(
    'ONLY_FULL_GROUP_BY,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,',
    'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'
);

-- ----------------------------------------------------------------------------
-- OPTIONAL: fresh install. Uncomment to create the database.
-- ----------------------------------------------------------------------------
-- CREATE DATABASE IF NOT EXISTS cmas
--     DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE cmas;

-- ----------------------------------------------------------------------------
-- OPTIONAL: teardown. DESTRUCTIVE — deletes all data. Uncomment only for a
-- clean re-install on a dev/staging box. NEVER run this on production.
-- ----------------------------------------------------------------------------
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP VIEW  IF EXISTS v_clo_attainment_summary, v_student_clo_attainment,
--                      v_activity_weight_audit, v_criteria_weight_audit,
--                      v_curriculum_coverage, v_course_teaching_team,
--                      v_objective_coverage;
-- DROP TABLE IF EXISTS ScoreUploadLog, Score, Student, ObjectiveAssessment,
--                      AssessmentCriteria, Activity, BehavioralObjective,
--                      CLO, CourseInstructor, Course, CurriculumCourse,
--                      Curriculum, `User`;
-- SET FOREIGN_KEY_CHECKS = 1;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- SECTION 1 — IDENTITY
-- ============================================================================

CREATE TABLE `User` (
    id           VARCHAR(30)  NOT NULL,
    email        VARCHAR(255) NOT NULL,
    name         VARCHAR(255) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    role         ENUM('ADMIN','INSTRUCTOR') NOT NULL DEFAULT 'INSTRUCTOR',
    isActive     TINYINT(1)   NOT NULL DEFAULT 1,
    createdAt    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_user_email (email),
    KEY idx_user_active (isActive),

    -- Cheap sanity check. Real validation belongs in the app layer; this only
    -- stops obviously malformed rows written by scripts/imports.
    CONSTRAINT chk_user_email  CHECK (email LIKE '%_@_%.__%'),
    CONSTRAINT chk_user_name   CHECK (CHAR_LENGTH(TRIM(name)) > 0),
    -- A bcrypt/argon2 hash is never this short. Catches a plaintext password
    -- accidentally written straight into the column.
    CONSTRAINT chk_user_hash   CHECK (CHAR_LENGTH(passwordHash) >= 20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 2 — CURRICULUM (the PLAN: what a programme requires)
-- ============================================================================

CREATE TABLE Curriculum (
    id          VARCHAR(30)  NOT NULL,
    name        VARCHAR(255) NOT NULL,
    year        INT          NOT NULL,
    institution VARCHAR(255) NOT NULL,
    clonedFrom  VARCHAR(30)  NULL,
    createdAt   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    -- One institution cannot publish the same curriculum name twice in a year.
    UNIQUE KEY uq_curriculum_identity (institution, name, year),
    KEY idx_curriculum_cloned (clonedFrom),

    -- FIX #2: clonedFrom is a Curriculum id — make it a real FK.
    -- SET NULL: deleting the ancestor must not delete its clones, it only
    -- breaks the lineage pointer.
    CONSTRAINT fk_curriculum_cloned_from
        FOREIGN KEY (clonedFrom) REFERENCES Curriculum (id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    -- Range covers both Buddhist Era (2567) and Common Era (2024) input.
    CONSTRAINT chk_curriculum_year CHECK (year BETWEEN 1900 AND 2700),
    CONSTRAINT chk_curriculum_name CHECK (CHAR_LENGTH(TRIM(name)) > 0),
    -- A curriculum cannot be cloned from itself.
    CONSTRAINT chk_curriculum_self_clone CHECK (clonedFrom IS NULL OR clonedFrom <> id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE CurriculumCourse (
    id           VARCHAR(30)  NOT NULL,
    curriculumId VARCHAR(30)  NOT NULL,

    -- FIX #1: the missing link. NULL until the course is actually opened,
    -- so a curriculum can still be drafted and cloned ahead of time.
    courseId     VARCHAR(30)  NULL,

    -- courseCode/courseName/credits stay denormalised ON PURPOSE: a published
    -- curriculum must not silently change when someone edits Course later.
    courseCode   VARCHAR(50)  NOT NULL,
    courseName   VARCHAR(255) NOT NULL,
    courseNameEn VARCHAR(255) NULL,

    -- FIX #11: the curriculum document writes credits as "3 (2-2-5)" —
    -- credits (lecture-practice-selfStudy). Storing only the leading number
    -- threw the other three away, and the old CHECK (credits BETWEEN 1 AND 30)
    -- rejected a course that genuinely exists in the 2567 curriculum:
    --     90641008  INTRODUCTION TO ENGLISH COMMUNICATION SKILLS  0 (0-0-45)
    -- Zero-credit prerequisites are legal, so the floor is now 0.
    credits          DECIMAL(3,1) NOT NULL,
    lectureHours     DECIMAL(4,1) NOT NULL DEFAULT 0,
    practiceHours    DECIMAL(4,1) NOT NULL DEFAULT 0,
    selfStudyHours   DECIMAL(4,1) NOT NULL DEFAULT 0,

    -- Seven courses (90641004-90641010) are graded ผ่าน (S) / ไม่ผ่าน (U)
    -- rather than on a percentage scale.
    gradingType  ENUM('LETTER','PASS_FAIL') NOT NULL DEFAULT 'LETTER',

    PRIMARY KEY (id),
    -- FIX #6: the same course code must not appear twice in one curriculum.
    UNIQUE KEY uq_curriculumcourse_code (curriculumId, courseCode),
    KEY idx_curriculumcourse_curriculum (curriculumId),
    KEY idx_curriculumcourse_course (courseId),

    -- CASCADE: these rows are owned by the curriculum, they have no meaning
    -- without it.
    CONSTRAINT fk_curriculumcourse_curriculum
        FOREIGN KEY (curriculumId) REFERENCES Curriculum (id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    -- fk_curriculumcourse_course is added by ALTER TABLE at the end of
    -- Section 7. It cannot be declared inline here because Course does not
    -- exist yet, and relying on FOREIGN_KEY_CHECKS = 0 to defer it would make
    -- this file fail whenever it is run with checks enabled.

    -- 0 is valid: non-credit prerequisites exist in the real curriculum.
    CONSTRAINT chk_curriculumcourse_credits CHECK (credits BETWEEN 0 AND 30),
    CONSTRAINT chk_curriculumcourse_hours   CHECK (lectureHours   >= 0
                                              AND practiceHours  >= 0
                                              AND selfStudyHours >= 0),
    CONSTRAINT chk_curriculumcourse_code    CHECK (CHAR_LENGTH(TRIM(courseCode)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 3 — COURSE OFFERING (the REALITY: what is taught this term)
-- ============================================================================

CREATE TABLE Course (
    id       VARCHAR(30)  NOT NULL,
    code     VARCHAR(50)  NOT NULL,
    name     VARCHAR(255) NOT NULL,
    semester INT          NOT NULL,
    year     INT          NOT NULL,

    -- FIX #10: replaces instructorId as the section discriminator.
    -- instructorId used to sit inside the unique key, which quietly made
    -- "same course, different teacher" mean "a different section". Once
    -- teaching became M:N that job had to move to an explicit column, or
    -- the key would have collapsed to (code, semester, year) and allowed
    -- only ONE section of a course per term.
    section  VARCHAR(10)  NOT NULL DEFAULT '01',

    PRIMARY KEY (id),
    UNIQUE KEY uq_course_offering (code, semester, year, section),
    KEY idx_course_term (year, semester),

    CONSTRAINT chk_course_semester CHECK (semester IN (1, 2, 3)),
    CONSTRAINT chk_course_year     CHECK (year BETWEEN 1900 AND 2700),
    CONSTRAINT chk_course_code     CHECK (CHAR_LENGTH(TRIM(code)) > 0),
    CONSTRAINT chk_course_section  CHECK (CHAR_LENGTH(TRIM(section)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- FIX #10 — teaching team. Many instructors teach many courses.
--
-- The old design (Course.instructorId) forced 1 course = 1 teacher, which does
-- not survive contact with lab/practicum subjects that are co-taught.
--
-- The junction carries its own attribute (role), which is the textbook signal
-- that this had to be a table rather than two FKs: "lead" is not a property of
-- the teacher, nor of the course — it is a property of the PAIRING.
-- ----------------------------------------------------------------------------
CREATE TABLE CourseInstructor (
    id         VARCHAR(30) NOT NULL,
    courseId   VARCHAR(30) NOT NULL,
    userId     VARCHAR(30) NOT NULL,
    role       ENUM('LEAD','CO','ASSISTANT') NOT NULL DEFAULT 'CO',
    assignedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    -- Holds courseId only on the LEAD row, NULL everywhere else. Because a
    -- UNIQUE index ignores NULLs, this enforces "at most one LEAD per course".
    -- MySQL has no partial indexes (Postgres would use WHERE role = 'LEAD'),
    -- so a generated column is the portable way to express it.
    leadKey VARCHAR(30) GENERATED ALWAYS AS
        (CASE WHEN role = 'LEAD' THEN courseId END) STORED,

    PRIMARY KEY (id),
    -- The same person cannot be added to the same course twice.
    UNIQUE KEY uq_courseinstructor_pair (courseId, userId),
    UNIQUE KEY uq_courseinstructor_lead (leadKey),
    KEY idx_courseinstructor_user (userId),

    CONSTRAINT fk_courseinstructor_course
        FOREIGN KEY (courseId) REFERENCES Course (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    -- RESTRICT: never let a User row vanish while they are still assigned to
    -- teach. Deactivate with User.isActive = 0 instead.
    CONSTRAINT fk_courseinstructor_user
        FOREIGN KEY (userId) REFERENCES `User` (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NOTE: "every course must have at least ONE lead" is deliberately NOT a
-- constraint. A course row has to exist before anyone can be assigned to it,
-- so any such rule would make the first INSERT impossible. Enforce it in the
-- application, and use v_course_teaching_team below to find violations.

-- ============================================================================
-- SECTION 4 — LEARNING OUTCOMES
-- ============================================================================

CREATE TABLE CLO (
    id          VARCHAR(30)   NOT NULL,
    courseId    VARCHAR(30)   NOT NULL,
    number      INT           NOT NULL,
    description VARCHAR(1000) NOT NULL,
    threshold   DOUBLE        NOT NULL DEFAULT 60,

    PRIMARY KEY (id),
    -- FIX #5: CLO numbering must be unique inside a course.
    UNIQUE KEY uq_clo_course_number (courseId, number),
    KEY idx_clo_course (courseId),

    CONSTRAINT fk_clo_course
        FOREIGN KEY (courseId) REFERENCES Course (id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_clo_number      CHECK (number > 0),
    -- threshold is a PERCENTAGE of the CLO's weighted score.
    CONSTRAINT chk_clo_threshold   CHECK (threshold >= 0 AND threshold <= 100),
    CONSTRAINT chk_clo_description CHECK (CHAR_LENGTH(TRIM(description)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE BehavioralObjective (
    id          VARCHAR(30)   NOT NULL,
    cloId       VARCHAR(30)   NOT NULL,

    -- FIX #12a: objectives were unordered and unnumbered, so "ข้อ 2 ของ CLO 1"
    -- could not be referenced from a report or a rubric.
    number      INT           NOT NULL,
    description VARCHAR(1000) NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_behavioral_clo_number (cloId, number),
    KEY idx_behavioral_clo (cloId),

    CONSTRAINT fk_behavioral_clo
        FOREIGN KEY (cloId) REFERENCES CLO (id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_behavioral_number      CHECK (number > 0),
    CONSTRAINT chk_behavioral_description CHECK (CHAR_LENGTH(TRIM(description)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SCOPE BOUNDARY — no PLO layer here, deliberately.
--
-- The 2567 curriculum does define 10 programme-level outcomes (PLO 1.1 - 4.2)
-- and reports quality assurance at both levels. This schema stops at the
-- COURSE level on purpose: the project's topic is CLO assessment, so the
-- entities are CLO and its behavioural objectives, and nothing above them.
--
-- Rolling CLO results up into PLO figures is the institutional model's job —
-- see plos / clo_plo_map in cmas_enterprise_mysql.sql. Adding a half-built PLO
-- layer here would only duplicate that, and a programme-level number computed
-- from one course's data would be misleading anyway.
-- ----------------------------------------------------------------------------

-- ============================================================================
-- SECTION 5 — ASSESSMENT
-- ============================================================================

CREATE TABLE Activity (
    id       VARCHAR(30)  NOT NULL,
    courseId VARCHAR(30)  NOT NULL,
    name     VARCHAR(255) NOT NULL,
    method   VARCHAR(255) NOT NULL,
    maxScore DOUBLE       NOT NULL,
    `order`  INT          NOT NULL,
    weight   DOUBLE       NOT NULL,

    PRIMARY KEY (id),
    KEY idx_activity_course (courseId),
    KEY idx_activity_order (courseId, `order`),

    CONSTRAINT fk_activity_course
        FOREIGN KEY (courseId) REFERENCES Course (id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    -- maxScore > 0 is critical: every attainment view divides by it.
    CONSTRAINT chk_activity_maxscore CHECK (maxScore > 0),
    CONSTRAINT chk_activity_weight   CHECK (weight >= 0 AND weight <= 100),
    CONSTRAINT chk_activity_order    CHECK (`order` >= 0),
    CONSTRAINT chk_activity_name     CHECK (CHAR_LENGTH(TRIM(name)) > 0)

    -- NOT added on purpose:
    --   UNIQUE (courseId, `order`) — drag-reorder writes intermediate states
    --     that would transiently collide unless the app reorders in one
    --     transaction with a deferred check (MySQL has no deferred FKs).
    --   UNIQUE (courseId, name)    — plausible rule, but it would reject data
    --     the current app already allows. Enable only after de-duplicating.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE AssessmentCriteria (
    id         VARCHAR(30) NOT NULL,
    activityId VARCHAR(30) NOT NULL,
    cloId      VARCHAR(30) NOT NULL,
    weight     DOUBLE      NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_criteria_activity_clo (activityId, cloId),
    KEY idx_criteria_clo (cloId),

    CONSTRAINT fk_criteria_activity
        FOREIGN KEY (activityId) REFERENCES Activity (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_criteria_clo
        FOREIGN KEY (cloId) REFERENCES CLO (id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_criteria_weight CHECK (weight > 0 AND weight <= 100)
    -- Cross-table rule (Activity.courseId must equal CLO.courseId) is enforced
    -- by trg_criteria_same_course_* below.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- FIX #12b — make BehavioralObjective reachable from assessment.
--
-- Objectives used to be a dead end: CLO 1-M BehavioralObjective and nothing
-- else pointed at them, so the system could store "what the student should be
-- able to do" but could never show WHERE that was measured.
--
-- This junction says: "criterion X (activity A measuring CLO C) specifically
-- addresses objectives 1 and 3 of that CLO."
--
-- It attaches to AssessmentCriteria rather than to Activity, so the CLO
-- calculation is untouched — weights still live one level up and the
-- attainment views keep working exactly as before. Mapping objectives is
-- OPTIONAL evidence/traceability, not an input to the score.
-- ----------------------------------------------------------------------------
CREATE TABLE ObjectiveAssessment (
    id          VARCHAR(30) NOT NULL,
    criteriaId  VARCHAR(30) NOT NULL,
    objectiveId VARCHAR(30) NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_objassess_pair (criteriaId, objectiveId),
    KEY idx_objassess_objective (objectiveId),

    CONSTRAINT fk_objassess_criteria
        FOREIGN KEY (criteriaId) REFERENCES AssessmentCriteria (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_objassess_objective
        FOREIGN KEY (objectiveId) REFERENCES BehavioralObjective (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    -- The objective must belong to the SAME CLO as the criterion.
    -- Enforced by trg_objassess_same_clo_* below.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 6 — ENROLMENT & SCORES
-- ============================================================================

CREATE TABLE Student (
    id          VARCHAR(30)  NOT NULL,
    studentCode VARCHAR(50)  NOT NULL,
    name        VARCHAR(255) NOT NULL,
    courseId    VARCHAR(30)  NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_student_code_course (studentCode, courseId),
    KEY idx_student_course (courseId),
    KEY idx_student_code (studentCode),

    CONSTRAINT fk_student_course
        FOREIGN KEY (courseId) REFERENCES Course (id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_student_code CHECK (CHAR_LENGTH(TRIM(studentCode)) > 0),
    CONSTRAINT chk_student_name CHECK (CHAR_LENGTH(TRIM(name)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Score (
    id         VARCHAR(30) NOT NULL,
    studentId  VARCHAR(30) NOT NULL,
    activityId VARCHAR(30) NOT NULL,
    score      DOUBLE      NOT NULL,
    uploadedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_score_student_activity (studentId, activityId),
    KEY idx_score_activity (activityId),
    KEY idx_score_uploaded (uploadedAt),

    CONSTRAINT fk_score_student
        FOREIGN KEY (studentId) REFERENCES Student (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_score_activity
        FOREIGN KEY (activityId) REFERENCES Activity (id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_score_non_negative CHECK (score >= 0)
    -- score <= Activity.maxScore, and Student/Activity same-course, are
    -- enforced by trg_score_validate_* below.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 7 — AUDIT
-- ============================================================================

CREATE TABLE ScoreUploadLog (
    id          VARCHAR(30)  NOT NULL,
    courseId    VARCHAR(30)  NOT NULL,
    uploadedBy  VARCHAR(30)  NOT NULL,
    fileName    VARCHAR(255) NOT NULL,
    recordsOk   INT          NOT NULL,
    recordsFail INT          NOT NULL,
    createdAt   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    KEY idx_uploadlog_course (courseId),
    KEY idx_uploadlog_user (uploadedBy),
    KEY idx_uploadlog_created (createdAt),

    -- FIX #3: these were bare strings — no integrity at all.
    CONSTRAINT fk_uploadlog_course
        FOREIGN KEY (courseId) REFERENCES Course (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    -- RESTRICT: an audit trail must not lose its actor.
    CONSTRAINT fk_uploadlog_user
        FOREIGN KEY (uploadedBy) REFERENCES `User` (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_uploadlog_ok   CHECK (recordsOk >= 0),
    CONSTRAINT chk_uploadlog_fail CHECK (recordsFail >= 0),
    CONSTRAINT chk_uploadlog_file CHECK (CHAR_LENGTH(TRIM(fileName)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Deferred FK: CurriculumCourse -> Course (FIX #1).
-- Declared here rather than inline because Course is created after
-- CurriculumCourse. Doing it this way means the whole file also runs correctly
-- with FOREIGN_KEY_CHECKS left ON.
-- SET NULL: closing an offering must not erase the curriculum requirement.
-- ----------------------------------------------------------------------------
ALTER TABLE CurriculumCourse
    ADD CONSTRAINT fk_curriculumcourse_course
        FOREIGN KEY (courseId) REFERENCES Course (id)
        ON DELETE SET NULL ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- SECTION 8 — TRIGGERS: cross-table rules CHECK cannot express
--
-- MySQL forbids subqueries inside CHECK, so these three integrity rules have
-- to live in triggers. Each fires BEFORE INSERT and BEFORE UPDATE.
--
-- NOTE FOR MySQL Workbench: "Reverse Engineer MySQL Create Script" may warn on
-- the DELIMITER lines. That is harmless — it only affects diagram import, not
-- execution. Run this file through the SQL editor or the mysql CLI instead.
-- ============================================================================

DELIMITER $$

-- ----------------------------------------------------------------------------
-- Rule A: a score can never exceed its activity's maximum.
-- Rule B: the student and the activity must belong to the same course.
--         Without this, an import that mismatches IDs quietly attributes marks
--         to the wrong class and every CLO report downstream is wrong.
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_score_validate_bi
BEFORE INSERT ON Score
FOR EACH ROW
BEGIN
    DECLARE v_max_score       DOUBLE;
    DECLARE v_activity_course VARCHAR(30);
    DECLARE v_student_course  VARCHAR(30);

    SELECT maxScore, courseId INTO v_max_score, v_activity_course
        FROM Activity WHERE id = NEW.activityId;

    SELECT courseId INTO v_student_course
        FROM Student WHERE id = NEW.studentId;

    IF NEW.score > v_max_score THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Score exceeds Activity.maxScore';
    END IF;

    IF v_student_course <> v_activity_course THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Student and Activity belong to different Courses';
    END IF;
END$$

CREATE TRIGGER trg_score_validate_bu
BEFORE UPDATE ON Score
FOR EACH ROW
BEGIN
    DECLARE v_max_score       DOUBLE;
    DECLARE v_activity_course VARCHAR(30);
    DECLARE v_student_course  VARCHAR(30);

    SELECT maxScore, courseId INTO v_max_score, v_activity_course
        FROM Activity WHERE id = NEW.activityId;

    SELECT courseId INTO v_student_course
        FROM Student WHERE id = NEW.studentId;

    IF NEW.score > v_max_score THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Score exceeds Activity.maxScore';
    END IF;

    IF v_student_course <> v_activity_course THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Student and Activity belong to different Courses';
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- Rule C: an Activity may only be mapped to a CLO of the SAME course.
--         This is the most damaging of the three — a cross-course mapping
--         produces plausible-looking but meaningless attainment percentages.
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_criteria_same_course_bi
BEFORE INSERT ON AssessmentCriteria
FOR EACH ROW
BEGIN
    DECLARE v_activity_course VARCHAR(30);
    DECLARE v_clo_course      VARCHAR(30);

    SELECT courseId INTO v_activity_course FROM Activity WHERE id = NEW.activityId;
    SELECT courseId INTO v_clo_course      FROM CLO      WHERE id = NEW.cloId;

    IF v_activity_course <> v_clo_course THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Activity and CLO must belong to the same Course';
    END IF;
END$$

CREATE TRIGGER trg_criteria_same_course_bu
BEFORE UPDATE ON AssessmentCriteria
FOR EACH ROW
BEGIN
    DECLARE v_activity_course VARCHAR(30);
    DECLARE v_clo_course      VARCHAR(30);

    SELECT courseId INTO v_activity_course FROM Activity WHERE id = NEW.activityId;
    SELECT courseId INTO v_clo_course      FROM CLO      WHERE id = NEW.cloId;

    IF v_activity_course <> v_clo_course THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Activity and CLO must belong to the same Course';
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- Rule E: an objective may only be attached to a criterion that measures the
--         objective's OWN CLO. Without this you could claim that a quiz
--         measuring CLO 1 provides evidence for an objective of CLO 3, which
--         makes the traceability report actively misleading.
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_objassess_same_clo_bi
BEFORE INSERT ON ObjectiveAssessment
FOR EACH ROW
BEGIN
    DECLARE v_criteria_clo  VARCHAR(30);
    DECLARE v_objective_clo VARCHAR(30);

    SELECT cloId INTO v_criteria_clo
        FROM AssessmentCriteria  WHERE id = NEW.criteriaId;
    SELECT cloId INTO v_objective_clo
        FROM BehavioralObjective WHERE id = NEW.objectiveId;

    IF v_criteria_clo <> v_objective_clo THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Objective belongs to a different CLO than the criterion';
    END IF;
END$$

CREATE TRIGGER trg_objassess_same_clo_bu
BEFORE UPDATE ON ObjectiveAssessment
FOR EACH ROW
BEGIN
    DECLARE v_criteria_clo  VARCHAR(30);
    DECLARE v_objective_clo VARCHAR(30);

    SELECT cloId INTO v_criteria_clo
        FROM AssessmentCriteria  WHERE id = NEW.criteriaId;
    SELECT cloId INTO v_objective_clo
        FROM BehavioralObjective WHERE id = NEW.objectiveId;

    IF v_criteria_clo <> v_objective_clo THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Objective belongs to a different CLO than the criterion';
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- Rule D: if CurriculumCourse is linked to a real Course, the codes must agree.
--         Stops the denormalised courseCode from drifting away from the
--         offering it claims to point at.
-- ----------------------------------------------------------------------------
CREATE TRIGGER trg_curriculumcourse_code_bi
BEFORE INSERT ON CurriculumCourse
FOR EACH ROW
BEGIN
    DECLARE v_course_code VARCHAR(50);

    IF NEW.courseId IS NOT NULL THEN
        SELECT code INTO v_course_code FROM Course WHERE id = NEW.courseId;
        IF v_course_code <> NEW.courseCode THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'CurriculumCourse.courseCode does not match Course.code';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_curriculumcourse_code_bu
BEFORE UPDATE ON CurriculumCourse
FOR EACH ROW
BEGIN
    DECLARE v_course_code VARCHAR(50);

    IF NEW.courseId IS NOT NULL THEN
        SELECT code INTO v_course_code FROM Course WHERE id = NEW.courseId;
        IF v_course_code <> NEW.courseCode THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'CurriculumCourse.courseCode does not match Course.code';
        END IF;
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- SECTION 9 — VIEWS
--
-- v_activity_weight_audit / v_criteria_weight_audit exist because "weights must
-- total 100" cannot be a row-level constraint: it is only true once data entry
-- is FINISHED. Enforcing it per row would block the first insert. Surface these
-- in the UI as a pre-publish checklist instead.
-- ============================================================================

-- Does each course's activity weighting add up to 100%?
CREATE OR REPLACE VIEW v_activity_weight_audit AS
SELECT
    c.id                                AS courseId,
    c.code                              AS courseCode,
    c.name                              AS courseName,
    c.semester,
    c.year,
    COUNT(a.id)                         AS activityCount,
    ROUND(COALESCE(SUM(a.weight), 0), 2) AS totalWeight,
    CASE
        WHEN COUNT(a.id) = 0                              THEN 'NO_ACTIVITIES'
        WHEN ROUND(COALESCE(SUM(a.weight), 0), 2) = 100   THEN 'OK'
        ELSE 'INVALID'
    END                                 AS status
FROM Course c
LEFT JOIN Activity a ON a.courseId = c.id
GROUP BY c.id, c.code, c.name, c.semester, c.year;

-- Does each activity's CLO criteria weighting add up to 100%?
CREATE OR REPLACE VIEW v_criteria_weight_audit AS
SELECT
    a.id                                  AS activityId,
    a.courseId,
    a.name                                AS activityName,
    COUNT(ac.id)                          AS criteriaCount,
    ROUND(COALESCE(SUM(ac.weight), 0), 2) AS totalWeight,
    CASE
        WHEN COUNT(ac.id) = 0                              THEN 'UNMAPPED'
        WHEN ROUND(COALESCE(SUM(ac.weight), 0), 2) = 100   THEN 'OK'
        ELSE 'INVALID'
    END                                   AS status
FROM Activity a
LEFT JOIN AssessmentCriteria ac ON ac.activityId = a.id
GROUP BY a.id, a.courseId, a.name;

-- Core business output: per-student CLO attainment.
--   raw ratio  = score / maxScore                      (0..1 per activity)
--   weighted   = SUM(ratio * criteriaWeight) / SUM(criteriaWeight) * 100
-- PASS when the weighted percentage reaches the CLO's own threshold.
CREATE OR REPLACE VIEW v_student_clo_attainment AS
SELECT
    s.id          AS studentId,
    s.studentCode,
    s.name        AS studentName,
    c.id          AS courseId,
    c.code        AS courseCode,
    cl.id         AS cloId,
    cl.number     AS cloNumber,
    cl.threshold,
    ROUND(
        SUM((sc.score / a.maxScore) * ac.weight)
        / NULLIF(SUM(ac.weight), 0) * 100
    , 2)          AS attainmentPercent,
    CASE
        WHEN ROUND(
                 SUM((sc.score / a.maxScore) * ac.weight)
                 / NULLIF(SUM(ac.weight), 0) * 100
             , 2) >= cl.threshold
        THEN 'PASS' ELSE 'FAIL'
    END           AS result
FROM Student s
JOIN Score              sc ON sc.studentId  = s.id
JOIN Activity           a  ON a.id          = sc.activityId
JOIN AssessmentCriteria ac ON ac.activityId = a.id
JOIN CLO                cl ON cl.id         = ac.cloId
JOIN Course             c  ON c.id          = s.courseId
GROUP BY s.id, s.studentCode, s.name, c.id, c.code,
         cl.id, cl.number, cl.threshold;

-- Course-level rollup: what share of students met each CLO threshold?
CREATE OR REPLACE VIEW v_clo_attainment_summary AS
SELECT
    courseId,
    courseCode,
    cloId,
    cloNumber,
    threshold,
    COUNT(*)                                                   AS studentsAssessed,
    SUM(result = 'PASS')                                       AS studentsPassed,
    ROUND(SUM(result = 'PASS') / COUNT(*) * 100, 2)            AS passRatePercent,
    ROUND(AVG(attainmentPercent), 2)                           AS avgAttainmentPercent
FROM v_student_clo_attainment
GROUP BY courseId, courseCode, cloId, cloNumber, threshold;

-- Curriculum coverage: which planned courses have actually been opened?
-- This view only became possible after FIX #1 added CurriculumCourse.courseId.
CREATE OR REPLACE VIEW v_curriculum_coverage AS
SELECT
    cur.id                AS curriculumId,
    cur.name              AS curriculumName,
    cur.year              AS curriculumYear,
    cc.courseCode,
    cc.courseName,
    cc.credits,
    cc.courseId,
    CASE WHEN cc.courseId IS NULL THEN 'NOT_OPENED' ELSE 'OPENED' END AS offeringStatus
FROM Curriculum cur
JOIN CurriculumCourse cc ON cc.curriculumId = cur.id;

-- Objective traceability: which behavioural objectives are actually evidenced
-- by an assessment, and which are only words in the course outline?
CREATE OR REPLACE VIEW v_objective_coverage AS
SELECT
    c.id        AS courseId,
    c.code      AS courseCode,
    cl.id       AS cloId,
    cl.number   AS cloNumber,
    bo.id       AS objectiveId,
    bo.number   AS objectiveNumber,
    bo.description,
    COUNT(oa.id) AS assessedByCriteria,
    GROUP_CONCAT(DISTINCT a.name ORDER BY a.name SEPARATOR ', ') AS activities,
    CASE WHEN COUNT(oa.id) = 0 THEN 'NOT_ASSESSED' ELSE 'OK' END AS status
FROM BehavioralObjective bo
JOIN CLO    cl ON cl.id = bo.cloId
JOIN Course c  ON c.id  = cl.courseId
LEFT JOIN ObjectiveAssessment oa ON oa.objectiveId = bo.id
LEFT JOIN AssessmentCriteria  ac ON ac.id          = oa.criteriaId
LEFT JOIN Activity            a  ON a.id           = ac.activityId
GROUP BY c.id, c.code, cl.id, cl.number, bo.id, bo.number, bo.description;

-- Teaching team per course, plus the "who is in charge?" audit.
-- leadCount = 0 flags a course nobody is formally responsible for — the rule
-- SQL cannot enforce at INSERT time (see the note under CourseInstructor).
CREATE OR REPLACE VIEW v_course_teaching_team AS
SELECT
    c.id       AS courseId,
    c.code     AS courseCode,
    c.name     AS courseName,
    c.section,
    c.semester,
    c.year,
    COUNT(ci.id)                                   AS instructorCount,
    SUM(ci.role = 'LEAD')                          AS leadCount,
    MAX(CASE WHEN ci.role = 'LEAD' THEN u.name END) AS leadName,
    GROUP_CONCAT(
        CONCAT(u.name, ' (', ci.role, ')')
        ORDER BY ci.role, u.name SEPARATOR ', '
    )                                              AS teachingTeam,
    CASE
        WHEN COUNT(ci.id) = 0          THEN 'NO_INSTRUCTOR'
        WHEN SUM(ci.role = 'LEAD') = 0 THEN 'NO_LEAD'
        ELSE 'OK'
    END                                            AS status
FROM Course c
LEFT JOIN CourseInstructor ci ON ci.courseId = c.id
LEFT JOIN `User`           u  ON u.id        = ci.userId
GROUP BY c.id, c.code, c.name, c.section, c.semester, c.year;

-- ============================================================================
-- PRISMA SYNC — read before running prisma migrate / db push
-- ----------------------------------------------------------------------------
-- database/schema.prisma must gain the new relation, or Prisma will try to
-- drop CurriculumCourse.courseId on the next migration:
--
--   model CurriculumCourse {
--     ...
--     courseId String?
--     course   Course? @relation(fields: [courseId], references: [id])
--     @@unique([curriculumId, courseCode])
--   }
--
--   model Course {
--     ...
--     curriculumCourses CurriculumCourse[]
--   }
--
--   model Curriculum {
--     ...
--     clonedFromId  String?      @map("clonedFrom")
--     clonedFromRef Curriculum?  @relation("CurriculumClone", fields: [clonedFromId], references: [id])
--     clones        Curriculum[] @relation("CurriculumClone")
--   }
--
--   model CLO { ... @@unique([courseId, number]) }
--
--   model Course {
--     ...                       // instructorId / instructor REMOVED
--     section     String             @default("01")
--     instructors CourseInstructor[]
--     @@unique([code, semester, year, section])
--   }
--
--   model CourseInstructor {
--     id       String     @id @default(cuid())
--     courseId String
--     course   Course     @relation(fields: [courseId], references: [id], onDelete: Cascade)
--     userId   String
--     user     User       @relation(fields: [userId], references: [id])
--     role     CourseRole @default(CO)
--     @@unique([courseId, userId])
--   }
--
-- database/schema.prisma has ALREADY been updated to match all of the above.
--
-- Prisma cannot express CHECK constraints, triggers, or generated columns.
-- That means `leadKey` + uq_courseinstructor_lead, every chk_* constraint, and
-- Sections 8-9 must live in a manual migration, or `prisma migrate` will drop
-- them on the next run.
--
-- POSTGRES NOTE: schema.prisma targets postgresql, and Postgres does not need
-- the leadKey trick — it has real partial indexes:
--     CREATE UNIQUE INDEX uq_courseinstructor_lead
--         ON "CourseInstructor" ("courseId") WHERE role = 'LEAD';
-- ============================================================================

-- ============================================================================
-- END — 13 tables · 17 foreign keys · 29 check constraints · 8 triggers · 7 views
--
-- Verify after running:
--   SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
--    WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'FOREIGN KEY';   -- 17
--   SELECT COUNT(*) FROM information_schema.CHECK_CONSTRAINTS
--    WHERE CONSTRAINT_SCHEMA = DATABASE();                                       -- 29
--   SELECT COUNT(*) FROM information_schema.TRIGGERS
--    WHERE TRIGGER_SCHEMA = DATABASE();                                          --  8
--   SELECT COUNT(*) FROM information_schema.VIEWS
--    WHERE TABLE_SCHEMA = DATABASE();                                            --  7
--
-- Health check after loading data — every one of these should return no rows:
--   SELECT * FROM v_course_teaching_team  WHERE status <> 'OK';  -- course with no lead
--   SELECT * FROM v_activity_weight_audit WHERE status <> 'OK';  -- weights != 100
--   SELECT * FROM v_criteria_weight_audit WHERE status <> 'OK';  -- activity not mapped to a CLO
--   SELECT * FROM v_objective_coverage    WHERE status <> 'OK';  -- objective with no evidence
--
-- Reporting (course level — มคอ.5):
--   SELECT * FROM v_student_clo_attainment WHERE courseId = ?;   -- per student
--   SELECT * FROM v_clo_attainment_summary WHERE courseId = ?;   -- per CLO
-- ============================================================================
