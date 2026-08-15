-- ============================================================================
-- CMAS / CLO SYSTEM — Application Schema — PRODUCTION DDL — v3 (COURSE-ROOT)
-- Target: MySQL 8.0.16 or newer  (8.0.16+ is REQUIRED — CHECK constraints are
--         parsed but silently IGNORED on every version below that)
--
-- Relationship to the other files in this folder:
--   cmas_app_mysql_v3.sql      = diagramming artifact (tables + FKs only)
--   cmas_app_production_v3.sql = THIS FILE. Same tables, hardened for real use:
--                                cascade rules, CHECK constraints, the LEAD
--                                generated column, cross-table triggers, and
--                                reporting/audit views.
--   (the v2 multi-tenant files cmas_app_mysql.sql / cmas_app_production.sql
--    were DELETED on 2026-08-03 — recover from git history if ever needed)
--
-- ============================================================================
-- WHAT CHANGED IN v3 — the multi-tenant layer was REMOVED
-- ----------------------------------------------------------------------------
-- v2 had 15 tables rooted at `Institution`; v3 has 11 rooted at `Course`.
--
-- DROPPED TABLES
--   Institution        single-tenant system (one faculty, KMITL). Its config
--                      columns moved to env — see CONFIG MOVED TO ENV below.
--   Membership         with one institution a per-institution role table is
--                      just a single FK; `role` moved back onto User.
--   Curriculum         out of scope for v1.
--   CurriculumCourse   out of scope, but five of its columns were NOT optional
--                      and moved UP onto Course: credits, lectureHours,
--                      practiceHours, selfStudyHours, gradingType.
--
-- DROPPED TRIGGERS — all three tenant-integrity rules, because the columns
-- they guarded no longer exist. Do NOT try to port them:
--   trg_student_tenant_matches_course_*   Student.institutionId is gone
--   trg_courseinstructor_membership_*     Membership is gone
--   trg_curriculumcourse_tenant_*         CurriculumCourse is gone
--   trg_curriculumcourse_code_*           CurriculumCourse is gone
-- 14 triggers in v2 -> 6 triggers here.
--
-- DROPPED VIEWS
--   v_curriculum_coverage      needed Curriculum + CurriculumCourse
--   v_institution_membership   needed Institution + Membership
-- 8 views in v2 -> 6 views here.
--
-- RETAINED TRIGGERS — these enforce rules inside a single course and are
-- unaffected by the tenancy removal. They are the ones that keep every CLO
-- number honest; never drop them:
--   Rule A  Score.score <= Activity.maxScore
--   Rule B  Score's Student and Activity belong to the same Course
--   Rule C  AssessmentCriteria maps an Activity and a CLO of the SAME course
--   Rule E  ObjectiveAssessment attaches an objective to a criterion of its
--           own CLO
--
-- ============================================================================
-- AUTHORIZATION MODEL (v3) — enforced in the APP, not in SQL
-- ----------------------------------------------------------------------------
-- CORRECTED 2026-08-04 to match SRS FR-25, which is the requirement source of
-- truth. An earlier draft of this header described ADMIN as ACCOUNTS-ONLY and
-- explicitly NOT a superset of INSTRUCTOR. The app does not implement that, and
-- SRS FR-25 says the opposite in one line: "INSTRUCTOR เห็นเฉพาะรายวิชาที่ตน
-- ถูกมอบหมาย ADMIN เห็นทั้งหมด".
--
-- ADMIN       manages accounts AND sees every course in the faculty. Needed
--             because someone has to create courses and assign the first
--             instructor to them (FR-20, FR-22) — a self-service-only model has
--             no answer for "who opens the course".
-- INSTRUCTOR  owns the academic data of the courses they are assigned to:
--             CLOs, activities, criteria, roster, scores. Co-instructors have
--             equal edit rights (ASM-03).
--
-- SQL cannot express "who is asking", so both rules live in rbac.middleware.ts
-- and services/authorization.service.ts. What SQL DOES enforce is that the data
-- itself stays internally consistent — that is what SECTION 7 is for.
--
-- The old draft's break-glass problem (only LEAD deactivated, nobody can
-- recover the course) DISAPPEARS under this model: ADMIN can reassign, because
-- ADMIN can see the course. v_course_teaching_team below still reports courses
-- with no active LEAD, which is now an operational report rather than a
-- design hole.
--
-- ⚠ The separation-of-duties concern behind the old draft is real and worth one
--   line in the thesis: an ADMIN can read every student's scores. Mitigation in
--   v1 is that ADMIN is 1-3 named people in one faculty, and every score import
--   is logged (FR-71). A read-audit log for ADMIN access is future work.
--
-- ============================================================================
-- CONFIG MOVED TO ENV (was columns on Institution)
-- ----------------------------------------------------------------------------
--   DEFAULT_PASS_CRITERIA=60   copied into Course.passCriteria at creation
--   DEFAULT_CLASS_TARGET=70    copied into Course.classTarget  at creation
--   ACADEMIC_YEAR_ERA=BE       Course.year is stored exactly as entered (2568)
--   SEMESTERS_PER_YEAR=3       the real bound on Course.semester; the DB CHECK
--                              below is only the coarse 1..6 band
--   SUMMER_SEMESTER=3          which semester number prints as ฤดูร้อน
--
-- These are COPIED into Course at creation, never resolved at read time.
-- Same reasoning as in v2: editing a default must not retroactively flip a
-- "ผ่านรายวิชา" or "CLO บรรลุ" verdict on a term that already closed.
--
-- ============================================================================
-- KNOWN TECHNICAL DEBT — expanding to PLO
-- ----------------------------------------------------------------------------
-- PLO (Program Learning Outcome) belongs to a PROGRAMME, and v3 has no
-- programme table. Adding PLO later requires CREATE TABLE Program plus a
-- BACKFILL of Course.programId across live data — it is NOT a purely additive
-- migration. Accepted for v1; record it in the project documentation.
-- ============================================================================

SET NAMES utf8mb4;

-- STRICT_ALL_TABLES so bad data is rejected rather than silently coerced.
-- ONLY_FULL_GROUP_BY is kept deliberately: the attainment views depend on
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
--                      v_objective_coverage, v_course_teaching_team;
-- DROP TABLE IF EXISTS ScoreUploadLog, Score, Student, ObjectiveAssessment,
--                      AssessmentCriteria, Activity, BehavioralObjective,
--                      CLO, CourseInstructor, Course, `User`;
-- SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- SECTION 1 — IDENTITY
-- ============================================================================

CREATE TABLE `User` (
    id           VARCHAR(30)  NOT NULL,
    -- One human, one credential. Login is email + password.
    email        VARCHAR(255) NOT NULL,
    name         VARCHAR(255) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,

    -- Back on User in v3 (it lived on Membership in v2). See the
    -- AUTHORIZATION MODEL note in the header for what each value may do —
    -- notably ADMIN is NOT a superset of INSTRUCTOR here.
    role         ENUM('ADMIN','INSTRUCTOR') NOT NULL DEFAULT 'INSTRUCTOR',

    -- Account-level kill switch. NEVER hard-delete a User who has taught a
    -- course or uploaded scores — the FKs below are RESTRICT for exactly that
    -- reason. Set isActive = 0 instead.
    isActive     TINYINT(1)   NOT NULL DEFAULT 1,
    createdAt    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    -- Needed because authMiddleware re-reads this row on EVERY request: when a
    -- role change or a deactivation takes effect is an auditable fact (NFR-19).
    updatedAt    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                              ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uq_user_email (email),
    -- One composite key replaces the old idx_user_active + idx_user_role pair:
    -- every user list filters on BOTH ("active instructors"), never on role
    -- alone, and MySQL can only use one index per table reference anyway.
    KEY idx_user_role_active (role, isActive),

    -- Cheap sanity checks. Real validation belongs in the app layer; these only
    -- stop obviously malformed rows written by scripts and imports.
    CONSTRAINT chk_user_email CHECK (email LIKE '%_@_%.__%'),
    CONSTRAINT chk_user_name  CHECK (CHAR_LENGTH(TRIM(name)) > 0),
    -- An argon2/bcrypt hash is never this short. Catches a plaintext password
    -- accidentally written straight into the column.
    CONSTRAINT chk_user_hash  CHECK (CHAR_LENGTH(passwordHash) >= 20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 2 — COURSE OFFERING (the root of the v3 hierarchy)
-- ============================================================================

CREATE TABLE Course (
    id             VARCHAR(30)  NOT NULL,
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(255) NOT NULL,   -- ชื่อไทย
    nameEn         VARCHAR(255) NULL,
    semester       INT          NOT NULL,
    year           INT          NOT NULL,   -- era per ACADEMIC_YEAR_ERA env value

    -- Section discriminator. Teaching is M:N, so no instructor column can act
    -- as the thing that separates two offerings of one course in one term.
    section        VARCHAR(10)  NOT NULL DEFAULT '01',

    -- ↓ MOVED UP FROM CurriculumCourse IN v3 ↓
    -- The curriculum document prints "3 (2-2-5)" =
    -- credits (lecture-practice-selfStudy). DECIMAL, not INT: storing only the
    -- leading number threw the other three away. The floor is 0 because
    -- 90641008 "0 (0-0-45)" is a real zero-credit prerequisite.
    credits        DECIMAL(3,1) NOT NULL DEFAULT 3.0,
    lectureHours   DECIMAL(4,1) NOT NULL DEFAULT 0,
    practiceHours  DECIMAL(4,1) NOT NULL DEFAULT 0,
    selfStudyHours DECIMAL(4,1) NOT NULL DEFAULT 0,
    -- Seven courses (90641004-90641010) are graded ผ่าน (S) / ไม่ผ่าน (U)
    -- instead of on a percentage scale.
    gradingType    ENUM('LETTER','PASS_FAIL') NOT NULL DEFAULT 'LETTER',

    -- Copied from the env defaults at creation, never resolved at read time.
    passCriteria   DOUBLE       NOT NULL DEFAULT 60,
    classTarget    DOUBLE       NOT NULL DEFAULT 70,

    createdAt      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    -- v2: (institutionId, code, semester, year, section). No institution column
    -- exists in v3, so the offering identity alone is the key. This is the one
    -- place where dropping tenancy CHANGED an existing constraint rather than
    -- just deleting one — a second faculty sharing this database would now
    -- collide on course codes. That is accepted: the system is single-tenant.
    UNIQUE KEY uq_course_offering (code, semester, year, section),
    KEY idx_course_term (year, semester),
    KEY idx_course_code (code),

    -- Coarse band only; the real bound is 1..SEMESTERS_PER_YEAR, enforced in Zod
    -- where the env config is visible.
    CONSTRAINT chk_course_semester CHECK (semester BETWEEN 1 AND 6),
    -- Range covers both Buddhist Era (2568) and Common Era (2025) input.
    CONSTRAINT chk_course_year     CHECK (year BETWEEN 1900 AND 2700),
    CONSTRAINT chk_course_code     CHECK (CHAR_LENGTH(TRIM(code)) > 0),
    CONSTRAINT chk_course_name     CHECK (CHAR_LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_course_section  CHECK (CHAR_LENGTH(TRIM(section)) > 0),
    -- 0 is valid: non-credit prerequisites exist in the real curriculum.
    CONSTRAINT chk_course_credits  CHECK (credits BETWEEN 0 AND 30),
    CONSTRAINT chk_course_hours    CHECK (lectureHours   >= 0
                                      AND practiceHours  >= 0
                                      AND selfStudyHours >= 0),
    CONSTRAINT chk_course_pass_criteria
        CHECK (passCriteria >= 0 AND passCriteria <= 100),
    CONSTRAINT chk_course_class_target
        CHECK (classTarget >= 0 AND classTarget <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Teaching team. The junction carries its own attribute (role), which is the
-- textbook signal that this had to be a table rather than two FKs: "lead" is
-- not a property of the teacher, nor of the course — it is a property of the
-- PAIRING.
--
-- v2 additionally required the user to hold an active Membership at the
-- course's institution (trg_courseinstructor_membership). That trigger is GONE
-- in v3 — there is one institution, so any active User is eligible. The
-- remaining guard is application-level: only an INSTRUCTOR already on the
-- course may invite others.
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
-- constraint. The course row has to exist before anyone can be assigned to it,
-- so any such rule would make the first INSERT impossible. Enforce it in the
-- application, and use v_course_teaching_team below to find violations — which
-- is also the report that surfaces the OPEN QUESTION in the header.

-- ============================================================================
-- SECTION 3 — LEARNING OUTCOMES
-- ============================================================================

CREATE TABLE CLO (
    id          VARCHAR(30)   NOT NULL,
    courseId    VARCHAR(30)   NOT NULL,
    number      INT           NOT NULL,
    description VARCHAR(1000) NOT NULL,
    threshold   DOUBLE        NOT NULL DEFAULT 60,

    PRIMARY KEY (id),
    -- CLO numbering must be unique inside a course — two "CLO 1" in one course
    -- silently corrupts every attainment report.
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

-- จุดประสงค์เชิงพฤติกรรม, numbered per CLO so "ข้อ 2 ของ CLO 1" can be cited
-- from a report or a rubric.
CREATE TABLE BehavioralObjective (
    id          VARCHAR(30)   NOT NULL,
    cloId       VARCHAR(30)   NOT NULL,
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
-- SCOPE BOUNDARY — no PLO layer.
--
-- The 2567 curriculum does define programme-level outcomes (PLO 1.1 - 4.2).
-- This schema stops at the COURSE level: the unit of analysis is the CLO and
-- its behavioural objectives.
--
-- v2 could say "PLO belongs in the institutional model" and point at a
-- Curriculum table. v3 cannot — Curriculum is gone too, so there is no parent
-- for a PLO to attach to at all. See KNOWN TECHNICAL DEBT in the header: the
-- future migration is a backfill, not an add.
-- ----------------------------------------------------------------------------

-- ============================================================================
-- SECTION 4 — ASSESSMENT
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
    --     that would transiently collide (MySQL has no deferred constraints).
    --   UNIQUE (courseId, name)    — plausible, but would reject data the
    --     current app already allows.
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
    -- by trg_criteria_same_course_* in SECTION 7.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Records WHICH behavioural objectives a criterion provides evidence for:
-- "criterion X (activity A measuring CLO C) specifically addresses objectives
-- 1 and 3 of that CLO."
--
-- It attaches to AssessmentCriteria rather than to Activity, so the CLO
-- calculation is untouched — weights live one level up and the attainment
-- views work identically whether or not objectives are mapped. Mapping is
-- OPTIONAL traceability, never an input to the score.
--
-- NOTE ON THE WORKFLOW: the use-case diagram draws
--     เพิ่มวัตถุประสงค์ ⊃include⊃ เพิ่มวิธีประเมิน ⊃include⊃ เพิ่มเกณฑ์ประเมิน
-- as a mandatory chain. That sequencing is a UI/process rule and is enforced in
-- the application (a course cannot be published while an objective has no
-- criterion). It is deliberately NOT a database constraint — making the link
-- mandatory here would put objective mapping on the score calculation path,
-- which is exactly what this table's placement is designed to avoid.
-- Use v_objective_coverage below to drive that pre-publish check.
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
    -- The objective must belong to the SAME CLO as the criterion — enforced by
    -- trg_objassess_same_clo_* in SECTION 7.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 5 — ENROLMENT & SCORES
-- ============================================================================

-- Models an ENROLMENT, not a person: one human taking five courses produces
-- five rows with a duplicated name. The Student(person)/Enrolment split stays
-- deferred; in v3 the future person's natural key is simply studentCode.
CREATE TABLE Student (
    id          VARCHAR(30)  NOT NULL,
    -- v2 carried a denormalised institutionId here, kept honest by
    -- trg_student_tenant_matches_course, so that (institutionId, studentCode)
    -- could be indexed. Both the column and the trigger are gone: with one
    -- institution there is no other university's student to collide with, so a
    -- bare index on studentCode is safe again.
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
    -- enforced by trg_score_validate_* in SECTION 7.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 6 — AUDIT
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

-- NOTE: v3 needs no ALTER TABLE at the end of the file. v2 had a forward
-- reference (CurriculumCourse -> Course) that had to be deferred; with
-- Course at the root, every FK points at a table already created above it.

-- ============================================================================
-- SECTION 7 — TRIGGERS: cross-table rules CHECK cannot express
--
-- MySQL forbids subqueries inside CHECK, so these rules live in triggers.
-- Each fires BEFORE INSERT and BEFORE UPDATE.
--
-- v2 had 14 triggers (7 rules x 2). v3 has 6 (3 rules x 2): the four tenant-
-- integrity triggers were dropped along with the columns they guarded. What
-- remains is everything that protects the CORRECTNESS OF A CLO NUMBER — never
-- drop these, they are the reason an attainment report can be trusted.
--
-- NOTE FOR MySQL Workbench: "Reverse Engineer MySQL Create Script" may warn on
-- the DELIMITER lines. Harmless — it affects diagram import, not execution.
-- Use cmas_app_mysql_v3.sql for diagramming and run THIS file through the SQL
-- editor or the mysql CLI.
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
--         The most damaging of the set — a cross-course mapping produces
--         plausible-looking but meaningless attainment percentages.
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

DELIMITER ;

-- ============================================================================
-- SECTION 8 — VIEWS
--
-- v_activity_weight_audit / v_criteria_weight_audit exist because "weights must
-- total 100" cannot be a row-level constraint: it is only true once data entry
-- is FINISHED. Enforcing it per row would block the first insert. Surface these
-- in the UI as a pre-publish checklist instead.
--
-- Every view below is the v2 view with institutionId removed from its SELECT
-- and GROUP BY. v_curriculum_coverage and v_institution_membership are gone.
-- ============================================================================

-- Does each course's activity weighting add up to 100%?
CREATE OR REPLACE VIEW v_activity_weight_audit AS
SELECT
    c.id                                 AS courseId,
    c.code                               AS courseCode,
    c.name                               AS courseName,
    c.semester,
    c.year,
    COUNT(a.id)                          AS activityCount,
    ROUND(COALESCE(SUM(a.weight), 0), 2) AS totalWeight,
    CASE
        WHEN COUNT(a.id) = 0                            THEN 'NO_ACTIVITIES'
        WHEN ROUND(COALESCE(SUM(a.weight), 0), 2) = 100 THEN 'OK'
        ELSE 'INVALID'
    END                                  AS status
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
        WHEN COUNT(ac.id) = 0                            THEN 'UNMAPPED'
        WHEN ROUND(COALESCE(SUM(ac.weight), 0), 2) = 100 THEN 'OK'
        ELSE 'INVALID'
    END                                   AS status
FROM Activity a
LEFT JOIN AssessmentCriteria ac ON ac.activityId = a.id
GROUP BY a.id, a.courseId, a.name;

-- Core business output: per-student CLO attainment.
--   raw ratio = score / maxScore                       (0..1 per activity)
--   weighted  = SUM(ratio * criteriaWeight) / SUM(criteriaWeight) * 100
-- PASS when the weighted percentage reaches the CLO's own threshold.
CREATE OR REPLACE VIEW v_student_clo_attainment AS
SELECT
    s.id      AS studentId,
    s.studentCode,
    s.name    AS studentName,
    c.id      AS courseId,
    c.code    AS courseCode,
    cl.id     AS cloId,
    cl.number AS cloNumber,
    cl.threshold,
    ROUND(
        SUM((sc.score / a.maxScore) * ac.weight)
        / NULLIF(SUM(ac.weight), 0) * 100
    , 2)      AS attainmentPercent,
    CASE
        WHEN ROUND(
                 SUM((sc.score / a.maxScore) * ac.weight)
                 / NULLIF(SUM(ac.weight), 0) * 100
             , 2) >= cl.threshold
        THEN 'PASS' ELSE 'FAIL'
    END       AS result
FROM Student s
JOIN Score              sc ON sc.studentId  = s.id
JOIN Activity           a  ON a.id          = sc.activityId
JOIN AssessmentCriteria ac ON ac.activityId = a.id
JOIN CLO                cl ON cl.id         = ac.cloId
JOIN Course             c  ON c.id          = s.courseId
GROUP BY s.id, s.studentCode, s.name, c.id, c.code,
         cl.id, cl.number, cl.threshold;

-- Course-level rollup: what share of students met each CLO threshold?
-- Compare passRatePercent against Course.classTarget to decide "CLO บรรลุ".
CREATE OR REPLACE VIEW v_clo_attainment_summary AS
SELECT
    courseId,
    courseCode,
    cloId,
    cloNumber,
    threshold,
    COUNT(*)                                        AS studentsAssessed,
    SUM(result = 'PASS')                            AS studentsPassed,
    ROUND(SUM(result = 'PASS') / COUNT(*) * 100, 2) AS passRatePercent,
    ROUND(AVG(attainmentPercent), 2)                AS avgAttainmentPercent
FROM v_student_clo_attainment
GROUP BY courseId, courseCode, cloId, cloNumber, threshold;

-- Objective traceability: which behavioural objectives are actually evidenced
-- by an assessment, and which are only words in the course outline?
-- This is the query that backs the mandatory
-- objective -> method -> criteria workflow: a course should not be publishable
-- while any row here reports NOT_ASSESSED.
CREATE OR REPLACE VIEW v_objective_coverage AS
SELECT
    c.id         AS courseId,
    c.code       AS courseCode,
    cl.id        AS cloId,
    cl.number    AS cloNumber,
    bo.id        AS objectiveId,
    bo.number    AS objectiveNumber,
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
-- SQL cannot enforce at INSERT time.
--
-- In v3 this view carries extra weight: because ADMIN cannot touch course data,
-- a course reaching NO_LEAD is not merely untidy, it is UNRECOVERABLE until the
-- OPEN QUESTION in the header is resolved. Treat any non-OK row as urgent.
CREATE OR REPLACE VIEW v_course_teaching_team AS
SELECT
    c.id   AS courseId,
    c.code AS courseCode,
    c.name AS courseName,
    c.section,
    c.semester,
    c.year,
    COUNT(ci.id)                                    AS instructorCount,
    SUM(ci.role = 'LEAD')                           AS leadCount,
    MAX(CASE WHEN ci.role = 'LEAD' THEN u.name END) AS leadName,
    -- Counts only instructors whose account is still enabled: this is what
    -- makes the "last active LEAD left" case visible before it bites.
    SUM(u.isActive = 1)                             AS activeInstructorCount,
    GROUP_CONCAT(
        CONCAT(u.name, ' (', ci.role, ')')
        ORDER BY ci.role, u.name SEPARATOR ', '
    )                                               AS teachingTeam,
    CASE
        WHEN COUNT(ci.id) = 0                THEN 'NO_INSTRUCTOR'
        WHEN SUM(ci.role = 'LEAD') = 0       THEN 'NO_LEAD'
        WHEN SUM(u.isActive = 1) = 0         THEN 'NO_ACTIVE_INSTRUCTOR'
        ELSE 'OK'
    END                                             AS status
FROM Course c
LEFT JOIN CourseInstructor ci ON ci.courseId = c.id
LEFT JOIN `User`           u  ON u.id        = ci.userId
GROUP BY c.id, c.code, c.name, c.section, c.semester, c.year;

-- ============================================================================
-- PRISMA SYNC — read before running prisma migrate
-- ----------------------------------------------------------------------------
-- ✅ IN SYNC as of 2026-08-04 (task 2.7). The three-step plan recorded here is
-- DONE — schema.prisma and this file now describe the same 11-table
-- single-tenant model:
--   1. schema.prisma            ✅ dropped Institution / Membership / Curriculum /
--                                  CurriculumCourse, moved credits + 3 hour
--                                  columns + gradingType onto Course, moved
--                                  `role` onto User, dropped isSuperAdmin and
--                                  the AcademicYearEra enum
--   2. Postgres migrations      ✅ 0001_init regenerated from the new schema;
--                                  0002 rewritten — the 4 tenant-integrity
--                                  triggers are gone, 3 same-course triggers
--                                  remain, uq_course_offering and the Student
--                                  index rewritten without institutionId
--   3. app/server/src           ✅ deleted lib/tenant-guard.ts (+test),
--                                  lib/tenant-context.ts, lib/prisma.unscoped.ts,
--                                  lib/tenant-isolation.test.ts,
--                                  lib/academic-year.ts,
--                                  middlewares/tenant.middleware.ts;
--                                  authMiddleware now re-reads the live User row
--                                  every request (NFR-19); rbac reads User.role;
--                                  assertCourseAccess takes the caller explicitly
--
-- ONE REMAINING DIFFERENCE, deliberate: this file ships 6 reporting/audit VIEWS
-- (v_course_teaching_team, v_activity_weight_audit, ...). Postgres has no
-- equivalent yet — those queries live in services/attainment.service.ts instead,
-- because FR-88 requires one calculation path shared by the dashboard and the
-- Excel export, and a view would be a second one.
--
-- Prisma cannot express CHECK constraints, triggers, or generated columns. That
-- means `leadKey` + uq_courseinstructor_lead, every chk_* constraint, and
-- SECTIONS 7-8 must live in a manual migration, or `prisma migrate` will drop
-- them on the next run. `prisma db push` deletes them silently and is banned in
-- every environment, including local.
--
-- POSTGRES NOTE: Postgres does not need the leadKey trick — it has real partial
-- indexes:
--     CREATE UNIQUE INDEX uq_courseinstructor_lead
--         ON "CourseInstructor" ("courseId") WHERE role = 'LEAD';
-- Postgres also collapses each _bi/_bu pair into one BEFORE INSERT OR UPDATE
-- trigger, so the 6 triggers here become 3 functions there.
-- ============================================================================

-- ============================================================================
-- END — 11 tables · 14 foreign keys · 28 check constraints · 6 triggers · 6 views
--        (v2 was: 15 · 22 · 37 · 14 · 8)
--
-- Verify after running:
--   SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
--    WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'FOREIGN KEY';  -- 14
--   SELECT COUNT(*) FROM information_schema.CHECK_CONSTRAINTS
--    WHERE CONSTRAINT_SCHEMA = DATABASE();                                      -- 28
--   SELECT COUNT(*) FROM information_schema.TRIGGERS
--    WHERE TRIGGER_SCHEMA = DATABASE();                                         --  6
--   SELECT COUNT(*) FROM information_schema.VIEWS
--    WHERE TABLE_SCHEMA = DATABASE();                                           --  6
--
-- Health check after loading data — every one of these should return no rows:
--   SELECT * FROM v_course_teaching_team  WHERE status <> 'OK';  -- no lead / no active instructor
--   SELECT * FROM v_activity_weight_audit WHERE status <> 'OK';  -- weights != 100
--   SELECT * FROM v_criteria_weight_audit WHERE status <> 'OK';  -- activity not mapped to a CLO
--   SELECT * FROM v_objective_coverage    WHERE status <> 'OK';  -- objective with no evidence
--
-- Reporting (course level — มคอ.5):
--   SELECT * FROM v_student_clo_attainment WHERE courseId = ?;   -- per student
--   SELECT * FROM v_clo_attainment_summary WHERE courseId = ?;   -- per CLO
-- ============================================================================
