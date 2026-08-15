-- ============================================================================
-- CMAS / CLO SYSTEM — Application Schema — MySQL 8.0 dialect — v3 (COURSE-ROOT)
--
-- Purpose : diagramming artifact for MySQL Workbench
--           File > Import > Reverse Engineer MySQL Create Script...
--           No ON DELETE actions, no CHECK constraints, no triggers, no views —
--           those live in cmas_app_production_v3.sql. This file exists so the
--           EER diagram draws cleanly.
--
-- ============================================================================
-- WHAT CHANGED IN v3 — the multi-tenant layer was REMOVED
-- ----------------------------------------------------------------------------
-- v2 had 15 tables rooted at `Institution`. v3 has 11 tables rooted at
-- `Course`. Four tables were deleted:
--
--   - Institution       the system is single-tenant (one faculty, KMITL), so
--                       there is no tenant boundary left to model. Its
--                       configuration columns (defaultPassCriteria,
--                       defaultClassTarget, yearEra, semestersPerYear,
--                       summerSemester) moved to application env config — see
--                       "CONFIG MOVED TO ENV" below.
--   - Membership        with only one institution, a per-institution role table
--                       degenerates into a single FK. `role` moved back onto
--                       `User` as a plain column.
--   - Curriculum        out of scope for v1.
--   - CurriculumCourse  out of scope for v1, BUT it held five columns the
--                       system genuinely needs, so those moved UP onto Course:
--                       credits, lectureHours, practiceHours, selfStudyHours,
--                       gradingType.
--
-- Consequences that are easy to miss:
--   * Course.code is now unique on (code, semester, year, section) — there is
--     no institutionId to lead the key any more.
--   * Student.institutionId is GONE, and so is the denormalisation it existed
--     to support. A bare index on studentCode is now safe, because there is
--     only one institution's students in the database.
--   * The AcademicYearEra ENUM ('BE'/'CE') no longer appears anywhere in SQL —
--     it was a column on Institution. Course.year is still written in whatever
--     era the faculty uses (2568, not 2025); the era is now an app-level
--     constant, not per-row data.
--
-- CONFIG MOVED TO ENV (no longer a table):
--     DEFAULT_PASS_CRITERIA=60      -> copied into Course.passCriteria at create
--     DEFAULT_CLASS_TARGET=70       -> copied into Course.classTarget at create
--     ACADEMIC_YEAR_ERA=BE
--     SEMESTERS_PER_YEAR=3
--     SUMMER_SEMESTER=3
--
-- KNOWN TECHNICAL DEBT — expanding to PLO later:
--   PLO (Program Learning Outcome) belongs to a PROGRAMME, and there is no
--   programme table in v3. Adding PLO in the future therefore requires
--   CREATE TABLE Program, then BACKFILLING Course.programId across live data —
--   it is NOT a purely additive migration. Accepted deliberately for v1.
--
-- Translation notes (Prisma/Postgres -> MySQL 8), unchanged from v2:
--   @id @default(cuid())   -> VARCHAR(30) PK (app generates the value)
--   String / Float / Int   -> VARCHAR / DOUBLE / INT
--   Boolean                -> TINYINT(1)
--   DateTime @default(now) -> DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
--   Reserved word "order"  -> back-ticked `order`
--   InnoDB + utf8mb4 for Thai text; FKs are table-level so Workbench draws them.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- IDENTITY
-- ----------------------------------------------------------------------------

-- `role` is back on User (it was on Membership in v2). With a single
-- institution there is nothing left for a per-institution role to vary across.
--
-- SCOPE OF ADMIN — decided for v3: ADMIN manages ACCOUNTS ONLY.
-- An ADMIN may create/deactivate users and nothing else. They may not read or
-- write Course, CLO, Activity, Score or Student. INSTRUCTOR owns all academic
-- data end to end and is self-service: an instructor creates their own courses,
-- makes themselves LEAD, and invites colleagues as CO/ASSISTANT.
-- This is enforced in the application layer (rbac middleware + course-access
-- service), not by SQL — SQL has no concept of who is asking.
--
-- ⚠ OPEN QUESTION, not yet decided (raised with the project advisor):
--   If the only LEAD of a course is deactivated and no CO/ASSISTANT exists,
--   nobody can recover that course — ADMIN is barred from course data, and no
--   other instructor can see a course they are not assigned to. There is
--   deliberately NO break-glass column here yet. Two candidate fixes:
--     (a) add User.isSuperAdmin back purely as an emergency reassignment gate
--     (b) require every course to carry at least 2 instructors as a policy
--   Do not invent a third option in code without deciding this first.
CREATE TABLE `User` (
    id           VARCHAR(30)  NOT NULL,
    email        VARCHAR(255) NOT NULL,   -- one human, one credential
    name         VARCHAR(255) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    role         ENUM('ADMIN','INSTRUCTOR') NOT NULL DEFAULT 'INSTRUCTOR',
    isActive     TINYINT(1)   NOT NULL DEFAULT 1,   -- account kill switch; never hard-delete
    createdAt    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                              ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_email (email),
    -- Composite, not two single-column keys: every user list is filtered by
    -- BOTH ("active instructors", "active admins") and never by role alone.
    KEY idx_user_role_active (role, isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- COURSE — the root of the hierarchy in v3
-- ----------------------------------------------------------------------------

-- Absorbed from CurriculumCourse: credits, the three hour columns, gradingType.
-- Without them the system would not know how many credits a course carries or
-- whether it is graded S/U — CurriculumCourse was their only home in v2.
CREATE TABLE Course (
    id             VARCHAR(30)  NOT NULL,
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(255) NOT NULL,   -- ชื่อไทย — the only name the UI renders
    nameEn         VARCHAR(255) NULL,
    semester       INT          NOT NULL,
    year           INT          NOT NULL,   -- era per ACADEMIC_YEAR_ERA env value
    -- Section discriminator. Teaching is M:N, so no instructor column can act
    -- as the thing that separates two offerings of the same course.
    section        VARCHAR(10)  NOT NULL DEFAULT '01',

    -- ↓ moved up from CurriculumCourse in v3 ↓
    -- The curriculum document prints credits as "3 (2-2-5)" =
    -- credits (lecture-practice-selfStudy). DECIMAL, not INT, and the floor is
    -- 0: 90641008 "0 (0-0-45)" is a real zero-credit prerequisite.
    credits        DECIMAL(3,1) NOT NULL DEFAULT 3.0,
    lectureHours   DECIMAL(4,1) NOT NULL DEFAULT 0,
    practiceHours  DECIMAL(4,1) NOT NULL DEFAULT 0,
    selfStudyHours DECIMAL(4,1) NOT NULL DEFAULT 0,
    -- Courses 90641004-90641010 are graded ผ่าน (S) / ไม่ผ่าน (U).
    gradingType    ENUM('LETTER','PASS_FAIL') NOT NULL DEFAULT 'LETTER',

    -- Copied from env defaults at creation, never resolved at read time:
    -- editing a default must not silently rewrite last term's report.
    passCriteria   DOUBLE       NOT NULL DEFAULT 60,  -- เกณฑ์ผ่านรายวิชา (%)
    classTarget    DOUBLE       NOT NULL DEFAULT 70,  -- สัดส่วนผู้ผ่าน CLO ที่ถือว่าบรรลุ (%)

    createdAt      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    -- v2 was (institutionId, code, semester, year, section). No institution
    -- column exists in v3, so the key is the offering identity alone.
    UNIQUE KEY uq_course_offering (code, semester, year, section),
    KEY idx_course_term (year, semester),
    KEY idx_course_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Many instructors teach many courses; `role` is a property of the PAIRING,
-- which is why this is a table and not two foreign keys.
CREATE TABLE CourseInstructor (
    id         VARCHAR(30) NOT NULL,
    courseId   VARCHAR(30) NOT NULL,
    userId     VARCHAR(30) NOT NULL,
    role       ENUM('LEAD','CO','ASSISTANT') NOT NULL DEFAULT 'CO',
    assignedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_courseinstructor_pair (courseId, userId),
    KEY idx_courseinstructor_user (userId),
    CONSTRAINT fk_courseinstructor_course
        FOREIGN KEY (courseId) REFERENCES Course (id),
    CONSTRAINT fk_courseinstructor_user
        FOREIGN KEY (userId) REFERENCES `User` (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- NOTE: "at most one LEAD per course" needs a generated column in MySQL —
-- see cmas_app_production_v3.sql. It is omitted here so Workbench draws a
-- plain junction table.
-- NOTE: v2's trg_courseinstructor_membership is GONE in v3 — it checked that
-- the user held an active Membership at the course's institution, and neither
-- table exists any more.

-- ----------------------------------------------------------------------------
-- LEARNING OUTCOMES
-- ----------------------------------------------------------------------------

CREATE TABLE CLO (
    id          VARCHAR(30)   NOT NULL,
    courseId    VARCHAR(30)   NOT NULL,
    number      INT           NOT NULL,
    description VARCHAR(1000) NOT NULL,
    threshold   DOUBLE        NOT NULL DEFAULT 60,  -- pass mark as a PERCENTAGE
    PRIMARY KEY (id),
    UNIQUE KEY uq_clo_course_number (courseId, number),
    KEY idx_clo_course (courseId),
    CONSTRAINT fk_clo_course
        FOREIGN KEY (courseId) REFERENCES Course (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- จุดประสงค์เชิงพฤติกรรม — the observable statements a CLO breaks down into.
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- No PLO layer, deliberately — and unlike v2 there is no Curriculum/Program
-- table to hang one on. See "KNOWN TECHNICAL DEBT" in the header.

-- ----------------------------------------------------------------------------
-- ASSESSMENT
-- ----------------------------------------------------------------------------

CREATE TABLE Activity (
    id       VARCHAR(30)  NOT NULL,
    courseId VARCHAR(30)  NOT NULL,
    name     VARCHAR(255) NOT NULL,
    method   VARCHAR(255) NOT NULL,
    maxScore DOUBLE       NOT NULL,   -- must be > 0: every attainment view divides by it
    `order`  INT          NOT NULL,
    weight   DOUBLE       NOT NULL,
    PRIMARY KEY (id),
    KEY idx_activity_course (courseId),
    KEY idx_activity_order (courseId, `order`),
    CONSTRAINT fk_activity_course
        FOREIGN KEY (courseId) REFERENCES Course (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Associative entity: Activity <-> CLO is M:N and `weight` belongs to the
-- pairing rather than to either side.
CREATE TABLE AssessmentCriteria (
    id         VARCHAR(30) NOT NULL,
    activityId VARCHAR(30) NOT NULL,
    cloId      VARCHAR(30) NOT NULL,
    weight     DOUBLE      NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_criteria_activity_clo (activityId, cloId),
    KEY idx_criteria_clo (cloId),
    CONSTRAINT fk_criteria_activity
        FOREIGN KEY (activityId) REFERENCES Activity (id),
    CONSTRAINT fk_criteria_clo
        FOREIGN KEY (cloId) REFERENCES CLO (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Traceability only: WHICH behavioural objectives a criterion evidences.
-- Attaches to AssessmentCriteria, not Activity, so the CLO score calculation
-- is unaffected by whether objectives are mapped at all.
CREATE TABLE ObjectiveAssessment (
    id          VARCHAR(30) NOT NULL,
    criteriaId  VARCHAR(30) NOT NULL,
    objectiveId VARCHAR(30) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_objassess_pair (criteriaId, objectiveId),
    KEY idx_objassess_objective (objectiveId),
    CONSTRAINT fk_objassess_criteria
        FOREIGN KEY (criteriaId) REFERENCES AssessmentCriteria (id),
    CONSTRAINT fk_objassess_objective
        FOREIGN KEY (objectiveId) REFERENCES BehavioralObjective (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ENROLMENT & SCORES
-- ----------------------------------------------------------------------------

-- Models an ENROLMENT, not a person: one human taking five courses produces
-- five rows with a duplicated name.
CREATE TABLE Student (
    id          VARCHAR(30)  NOT NULL,
    -- v2 carried a denormalised institutionId here, enforced by a trigger, so
    -- that (institutionId, studentCode) could be indexed. Both the column and
    -- the trigger are gone in v3: with one institution, studentCode alone is
    -- unambiguous and a bare index on it is safe.
    studentCode VARCHAR(50)  NOT NULL,
    name        VARCHAR(255) NOT NULL,
    courseId    VARCHAR(30)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_student_code_course (studentCode, courseId),
    KEY idx_student_course (courseId),
    KEY idx_student_code (studentCode),
    CONSTRAINT fk_student_course
        FOREIGN KEY (courseId) REFERENCES Course (id)
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
    CONSTRAINT fk_score_student
        FOREIGN KEY (studentId) REFERENCES Student (id),
    CONSTRAINT fk_score_activity
        FOREIGN KEY (activityId) REFERENCES Activity (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- AUDIT — outside the calculation path. Nothing references these rows.
-- ----------------------------------------------------------------------------

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
        FOREIGN KEY (courseId) REFERENCES Course (id),
    CONSTRAINT fk_uploadlog_user
        FOREIGN KEY (uploadedBy) REFERENCES `User` (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- END — 11 tables · 14 foreign keys · 0 deferred FKs
--
-- v2 needed an ALTER TABLE at the end of the file to add
-- CurriculumCourse -> Course, because the two tables were declared in the wrong
-- order. v3 has no forward reference at all: every FK points at a table already
-- created above it, so the file runs top-to-bottom with FOREIGN_KEY_CHECKS ON.
--
-- MySQL Workbench:
--   File > Import > Reverse Engineer MySQL Create Script...   (select this file)
--   Then: Database > Forward Engineer... to regenerate, or save as
--   cmas_app_product-v3.mwb.
--
-- TABLE COUNT vs v2:  15 -> 11
--   removed: Institution, Membership, Curriculum, CurriculumCourse
--   changed: User (+role, -isSuperAdmin), Course (+5 columns from
--            CurriculumCourse, -institutionId), Student (-institutionId)
--
-- The executable schema — cascade rules, CHECK constraints, the LEAD generated
-- column, triggers and reporting views — is cmas_app_production_v3.sql.
-- ============================================================================
