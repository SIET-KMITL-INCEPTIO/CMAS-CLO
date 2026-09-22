-- ============================================================================
-- CMAS / CLO SYSTEM — Application Schema — MySQL 8.0 dialect — v4 (GRADING)
--
-- Purpose : diagramming artifact for MySQL Workbench
--           File > Import > Reverse Engineer MySQL Create Script...
--           No ON DELETE actions, no CHECK constraints, no triggers, no views —
--           those live in cmas_app_production_v*.sql. This file exists so the
--           EER diagram draws cleanly.
--
-- Source of truth is database/schema.prisma (PostgreSQL). This file is a
-- HAND-MAINTAINED MIRROR for diagramming only. Nothing deploys from it. When
-- the two disagree, the Prisma schema wins and this file is the one to fix.
--
-- ============================================================================
-- WHAT CHANGED IN v4 (2026-08-23) — grading + CLO improvements
-- ----------------------------------------------------------------------------
-- 11 tables -> 13. Two tables implement การตัดเกรด (grade cutting) in both
-- อิงเกณฑ์ (criterion-referenced) and อิงกลุ่ม (norm-referenced) forms:
--
--   GradeBand     the ladder: A >= 80, B+ >= 75, ... one row per grade
--   StudentGrade  one student's final grade
--
-- SIMPLIFIED 2026-09-06 — the grading side is TWO tables and nine columns, down
-- from four tables and 35. The system exists to report CLO attainment; grading
-- is a secondary output and now stores the smallest thing that still answers
-- "what grade, on what ladder, decided which way".
--
--   GradeScheme  DELETED — it held the method and the unit its bands are read
--                in, and the second follows from the first, so both collapsed
--                into the single new column Course.gradeMethod.
--   GradeRun     DELETED — see the trade-off note below.
--   plus the twelve redundant columns removed on 2026-09-05 (GradeBand.order,
--   GradeRun.status, StudentGrade.tScore/.zScore/.isOverridden, and so on).
--
-- THE ONE THING THIS GIVES UP
--   GradeRun froze n / mean / sd at the moment grades were cut, which is what
--   let a อิงกลุ่ม letter be re-derived years later. The awarded letter is still
--   permanent — StudentGrade.grade is stored, not recomputed on read, so no
--   withdrawal can change it — but the arithmetic behind a curved letter can no
--   longer be reproduced from the database alone. For an อิงเกณฑ์ course nothing
--   is lost: the ladder plus totalPercent reproduces the letter exactly.
--   To restore it, add ONE table (courseId, n, mean, sd, computedAt) and point
--   StudentGrade at it. Do not bring GradeScheme back with it.
--
-- COLUMN CHANGES
--   Course.gradingType  RENAMED to Course.gradeScale. It was one word away from
--                       gradeMethod and meant something else entirely:
--                       gradeScale is the OUTPUT (letters vs S/U), gradeMethod
--                       is HOW the cutoff is computed.
--   Course.gradeMethod  NEW (2026-09-06). อิงเกณฑ์ / อิงกลุ่ม — absorbed from the
--                       deleted GradeScheme table.
--   CLO.bloomLevel      NEW, nullable. Cognitive level of the outcome. No
--                       default on purpose — guessing REMEMBER for every legacy
--                       row defeats the point of having the column.
--   CLO.classTarget     NEW, nullable. Per-CLO override of Course.classTarget;
--                       NULL means inherit. A CLO written at CREATE level
--                       carries a different expected pass rate than one at
--                       REMEMBER, which one course-wide number cannot express.
--
-- SCOPE LIMIT THE DIAGRAM MAKES VISIBLE
--   GradeBand hangs off Course, and one Course row IS one หมู่เรียน (section).
--   So the norm-referenced population is a single section. Pooling several
--   sections of one course code into a shared curve is NOT supported: CLO and
--   Activity both hang off courseId, so section 01's "สอบกลางภาค" and section
--   02's are unrelated rows with nothing to match them on. Supporting it needs
--   a CourseOffering level ABOVE Course, which reverses the 2026-08-04
--   single-root decision. Do not half-implement it.
--
-- ============================================================================
-- WHAT CHANGED IN v3 — the multi-tenant layer was REMOVED (kept for context)
-- ----------------------------------------------------------------------------
-- v2 had 15 tables rooted at `Institution`; v3 had 11 rooted at `Course`.
-- Institution, Membership, Curriculum and CurriculumCourse were deleted, and
-- five CurriculumCourse columns moved UP onto Course: credits, lectureHours,
-- practiceHours, selfStudyHours, and what is now gradeScale.
--
-- Consequences that are easy to miss:
--   * Course identity is (code, semester, year, section) — no institutionId.
--   * Student.institutionId is GONE; a bare index on studentCode is safe now.
--   * The AcademicYearEra ENUM is gone. Course.year is written in whatever era
--     the faculty uses (2568, not 2025) as an app-level constant.
--
-- CONFIG THAT LIVES IN ENV, NOT IN A TABLE:
--     DEFAULT_PASS_CRITERIA=60   -> copied into Course.passCriteria at create
--     DEFAULT_CLASS_TARGET=70    -> copied into Course.classTarget at create
--     ACADEMIC_YEAR_ERA=BE
--
-- ============================================================================
-- AUTHORIZATION MODEL — enforced in the APP, not in SQL
-- ----------------------------------------------------------------------------
-- CORRECTED IN v4. The v3 copy of this file still carried a draft note saying
-- "ADMIN manages ACCOUNTS ONLY ... an instructor creates their own courses and
-- makes themselves LEAD". That was never true of the requirements and directly
-- contradicts SRS FR-20 and FR-22:
--
--     FR-20  ADMIN สร้าง/แก้ไขรายวิชา
--     FR-22  ADMIN มอบหมายอาจารย์เข้ารายวิชา
--     FR-25  INSTRUCTOR เห็นเฉพาะรายวิชาที่ตนถูกมอบหมาย · ADMIN เห็นทั้งหมด
--
-- If instructors could create courses and assign themselves, the course-scope
-- boundary FR-25 and NFR-07 rest on would be self-service and meaningless.
-- ADMIN owns User and Course; INSTRUCTOR owns everything inside an assigned
-- course. SQL has no concept of who is asking, so none of this is expressible
-- here — it lives in the rbac middleware and the course-access service.
--
-- ============================================================================
-- MYSQL DIALECT NOTES
-- ----------------------------------------------------------------------------
--   cuid PK                -> VARCHAR(30)
--   PostgreSQL enums       -> inline ENUM(...) (MySQL has no CREATE TYPE)
--   DOUBLE PRECISION       -> DOUBLE
--   TIMESTAMP(3)           -> DATETIME(3)
--   BOOLEAN                -> TINYINT(1)
--   Reserved words         -> back-ticked: `User`, `order`, `rank`, `n`
--   InnoDB + utf8mb4 for Thai text; FKs are table-level so Workbench draws them
--
--   Table COMMENTs are new in v4 — Workbench renders them in the EER diagram,
--   so the picture explains itself without this file open beside it.
--
--   "At most one LEAD per course" is a partial unique index on PostgreSQL and
--   needs a generated column on MySQL. Omitted here so Workbench draws a plain
--   junction table; see cmas_app_production_v*.sql for the real thing.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- OPTIONAL teardown for re-importing over an existing model. DESTRUCTIVE —
-- uncomment only against a scratch schema, never anything holding data.
-- DROP TABLE IF EXISTS StudentGrade, GradeBand,
--                      ScoreUploadLog, Score, Student, ObjectiveAssessment,
--                      AssessmentCriteria, Activity, BehavioralObjective,
--                      CLO, CourseInstructor, Course, `User`;

-- ----------------------------------------------------------------------------
-- IDENTITY
-- ----------------------------------------------------------------------------

CREATE TABLE `User` (
    id           VARCHAR(30)  NOT NULL,
    email        VARCHAR(255) NOT NULL   COMMENT 'one human, one credential',
    name         VARCHAR(255) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL   COMMENT 'argon2 only',
    role         ENUM('ADMIN','INSTRUCTOR') NOT NULL DEFAULT 'INSTRUCTOR',
    isActive     TINYINT(1)   NOT NULL DEFAULT 1
                              COMMENT 'kill switch — never hard-delete a User',
    createdAt    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                              ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_email (email),
    -- Composite, not two single-column keys: every user list filters by BOTH
    -- ("active instructors", "active admins") and never by role alone.
    KEY idx_user_role_active (role, isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ผู้ใช้ระบบ — ADMIN หรือ INSTRUCTOR (ไม่มี role นักศึกษา)';

-- ----------------------------------------------------------------------------
-- COURSE — the root of the hierarchy. Nothing sits above it.
-- ----------------------------------------------------------------------------

CREATE TABLE Course (
    id             VARCHAR(30)  NOT NULL,
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(255) NOT NULL   COMMENT 'ชื่อไทย — the name the UI renders',
    nameEn         VARCHAR(255) NULL,
    semester       INT          NOT NULL,
    year           INT          NOT NULL   COMMENT 'พ.ศ. as entered by the faculty',
    -- Section discriminator. Teaching is M:N, so no instructor column can act
    -- as the thing that separates two offerings of the same course.
    section        VARCHAR(10)  NOT NULL DEFAULT '01'
                                COMMENT 'หมู่เรียน — one row = one section',

    -- Curriculum prints credits as "3 (2-2-5)". DECIMAL, not INT, and the floor
    -- is 0: 90641008 "0 (0-0-45)" is a real zero-credit prerequisite.
    credits        DECIMAL(3,1) NOT NULL DEFAULT 3.0,
    lectureHours   DECIMAL(4,1) NOT NULL DEFAULT 0,
    practiceHours  DECIMAL(4,1) NOT NULL DEFAULT 0,
    selfStudyHours DECIMAL(4,1) NOT NULL DEFAULT 0,

    -- RENAMED from gradingType in v4. The OUTPUT scale, not the method:
    -- courses 90641004-90641010 report ผ่าน (S) / ไม่ผ่าน (U).
    gradeScale     ENUM('LETTER','PASS_FAIL') NOT NULL DEFAULT 'LETTER'
                                COMMENT 'output scale — S/U or letters',

    -- The whole grading configuration of a course, after GradeScheme was
    -- removed. The unit GradeBand.minValue is read in follows from this value.
    gradeMethod    ENUM('CRITERION_REFERENCED','NORM_REFERENCED') NOT NULL
                                DEFAULT 'CRITERION_REFERENCED'
                                COMMENT 'อิงเกณฑ์ / อิงกลุ่ม',

    -- Course-level, never global: changing a faculty-wide default must not
    -- retroactively rewrite last term's verdicts.
    passCriteria   DOUBLE       NOT NULL DEFAULT 60
                                COMMENT 'เกณฑ์คะแนนรวมที่ถือว่าผ่านรายวิชา (%)',
    classTarget    DOUBLE       NOT NULL DEFAULT 70
                                COMMENT 'สัดส่วนผู้ผ่าน CLO จึงถือว่าบรรลุ (%) — CLO may override',

    createdAt      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_course_offering (code, semester, year, section),
    KEY idx_course_term (year, semester),
    KEY idx_course_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='รายวิชา 1 แถว = 1 หมู่เรียน — รากของลำดับชั้นข้อมูลทั้งหมด';

-- Many instructors teach many courses; `role` is a property of the PAIRING,
-- which is why this is a table and not two foreign keys.
CREATE TABLE CourseInstructor (
    id         VARCHAR(30) NOT NULL,
    courseId   VARCHAR(30) NOT NULL,
    userId     VARCHAR(30) NOT NULL,
    role       ENUM('LEAD','CO','ASSISTANT') NOT NULL DEFAULT 'CO'
                           COMMENT 'at most one LEAD per course (app + generated col)',
    assignedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_courseinstructor_pair (courseId, userId),
    KEY idx_courseinstructor_user (userId),
    CONSTRAINT fk_courseinstructor_course
        FOREIGN KEY (courseId) REFERENCES Course (id),
    CONSTRAINT fk_courseinstructor_user
        FOREIGN KEY (userId) REFERENCES `User` (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='มอบหมายผู้สอนเข้ารายวิชา (ADMIN เป็นผู้มอบหมาย — FR-22)';

-- ----------------------------------------------------------------------------
-- LEARNING OUTCOMES
-- ----------------------------------------------------------------------------

CREATE TABLE CLO (
    id          VARCHAR(30)   NOT NULL,
    courseId    VARCHAR(30)   NOT NULL,
    number      INT           NOT NULL,
    description VARCHAR(1000) NOT NULL,
    threshold   DOUBLE        NOT NULL DEFAULT 60
                              COMMENT 'เกณฑ์ผ่านรายคน (%) — CLO Target',

    -- NEW in v4. Nullable and WITHOUT a default: the column exists to check
    -- that assessment method matches cognitive level, and a fabricated
    -- REMEMBER on every legacy row would quietly defeat that.
    bloomLevel  ENUM('REMEMBER','UNDERSTAND','APPLY',
                     'ANALYZE','EVALUATE','CREATE') NULL
                              COMMENT 'ระดับพฤติกรรมตาม Bloom — จำ/เข้าใจ/ประยุกต์/วิเคราะห์/ประเมิน/สร้างสรรค์',

    -- NEW in v4. NULL = inherit Course.classTarget.
    classTarget DOUBLE        NULL
                              COMMENT 'override สัดส่วนผู้ผ่านเฉพาะ CLO นี้ (%) — NULL = ใช้ค่าของ Course',

    PRIMARY KEY (id),
    -- Two "CLO 1" in one course silently corrupts every attainment report.
    UNIQUE KEY uq_clo_course_number (courseId, number),
    KEY idx_clo_course (courseId),
    CONSTRAINT fk_clo_course
        FOREIGN KEY (courseId) REFERENCES Course (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ผลลัพธ์การเรียนรู้ระดับรายวิชา — วัดแบบอิงเกณฑ์เสมอ ไม่ขึ้นกับการตัดเกรด';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='จุดประสงค์เชิงพฤติกรรมที่แตกย่อยจาก CLO';

-- No PLO layer, deliberately. Curriculum/PLO/มคอ.2 mapping was cut in full on
-- 2026-08-04 and is NOT pending work — Course is the top of the hierarchy.

-- ----------------------------------------------------------------------------
-- ASSESSMENT
-- ----------------------------------------------------------------------------

CREATE TABLE Activity (
    id       VARCHAR(30)  NOT NULL,
    courseId VARCHAR(30)  NOT NULL,
    name     VARCHAR(255) NOT NULL,
    method   VARCHAR(255) NOT NULL,
    maxScore DOUBLE       NOT NULL COMMENT 'must be > 0 — every formula divides by it',
    `order`  INT          NOT NULL,
    weight   DOUBLE       NOT NULL COMMENT '% of course total; all activities sum to 100',
    PRIMARY KEY (id),
    KEY idx_activity_course (courseId),
    KEY idx_activity_order (courseId, `order`),
    CONSTRAINT fk_activity_course
        FOREIGN KEY (courseId) REFERENCES Course (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='กิจกรรมประเมิน — คะแนนถูกบันทึกรายกิจกรรมเท่านั้น';

-- Associative entity: Activity <-> CLO is M:N and `weight` belongs to the
-- pairing rather than to either side.
CREATE TABLE AssessmentCriteria (
    id         VARCHAR(30) NOT NULL,
    activityId VARCHAR(30) NOT NULL,
    cloId      VARCHAR(30) NOT NULL,
    weight     DOUBLE      NOT NULL COMMENT '% of THIS activity measuring THIS CLO; sums to 100 per activity',
    PRIMARY KEY (id),
    UNIQUE KEY uq_criteria_activity_clo (activityId, cloId),
    KEY idx_criteria_clo (cloId),
    CONSTRAINT fk_criteria_activity
        FOREIGN KEY (activityId) REFERENCES Activity (id),
    CONSTRAINT fk_criteria_clo
        FOREIGN KEY (cloId) REFERENCES CLO (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ผูก Activity กับ CLO พร้อมน้ำหนักต่อคู่';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ตามรอยเท่านั้น — ไม่กระทบคะแนน CLO ที่คำนวณได้';

-- ----------------------------------------------------------------------------
-- ENROLMENT & SCORES
-- ----------------------------------------------------------------------------

-- Models an ENROLMENT, not a person: one human taking five courses produces
-- five rows with a duplicated name.
CREATE TABLE Student (
    id          VARCHAR(30)  NOT NULL,
    studentCode VARCHAR(50)  NOT NULL,
    name        VARCHAR(255) NOT NULL,
    courseId    VARCHAR(30)  NOT NULL,
    PRIMARY KEY (id),
    -- Unique inside a course. The same code in two courses is two enrolments
    -- of one person, which is correct and must stay legal.
    UNIQUE KEY uq_student_code_course (studentCode, courseId),
    KEY idx_student_course (courseId),
    KEY idx_student_code (studentCode),
    CONSTRAINT fk_student_course
        FOREIGN KEY (courseId) REFERENCES Course (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='การลงทะเบียน 1 แถว = 1 คน 1 วิชา (ไม่ใช่ตารางบุคคล)';

CREATE TABLE Score (
    id         VARCHAR(30) NOT NULL,
    studentId  VARCHAR(30) NOT NULL,
    activityId VARCHAR(30) NOT NULL,
    -- NOT NULL, and no row means "ยังไม่ประเมิน". A 0 here is a real zero the
    -- student earned; the ABSENCE of the row is the missing value.
    score      DOUBLE      NOT NULL,
    uploadedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_score_student_activity (studentId, activityId),
    KEY idx_score_activity (activityId),
    CONSTRAINT fk_score_student
        FOREIGN KEY (studentId) REFERENCES Student (id),
    CONSTRAINT fk_score_activity
        FOREIGN KEY (activityId) REFERENCES Activity (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='คะแนนดิบรายกิจกรรม — ไม่มีแถว = ยังไม่ประเมิน (ไม่ใช่ 0)';

-- ----------------------------------------------------------------------------
-- GRADING — การตัดเกรด (NEW IN v4)
--
-- Three axes stay separate and must never be collapsed:
--   การบรรลุ CLO    always criterion-referenced, even for a curved course
--   ผ่าน/ไม่ผ่านวิชา  Course.passCriteria
--   เกรด            this section
-- Group statistics must never reach the first two.
-- ----------------------------------------------------------------------------

-- The ladder. minValue is read in the unit Course.gradeMethod implies:
-- percent for อิงเกณฑ์ (A >= 80), T-score for อิงกลุ่ม (A >= T65). There is no
-- boundaryUnit column because there is no third option, and no `order` column
-- because rank is ORDER BY minValue DESC — which the unique key below makes
-- total.
CREATE TABLE GradeBand (
    id       VARCHAR(30) NOT NULL,
    courseId VARCHAR(30) NOT NULL,
    grade    VARCHAR(5)  NOT NULL COMMENT 'A, B+, ... or S, U',
    minValue DOUBLE      NOT NULL COMMENT 'lower bound — % or T-score',
    PRIMARY KEY (id),
    UNIQUE KEY uq_gradeband_course_grade (courseId, grade),
    UNIQUE KEY uq_gradeband_course_minvalue (courseId, minValue),
    CONSTRAINT fk_gradeband_course
        FOREIGN KEY (courseId) REFERENCES Course (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ช่วงเกรดของรายวิชา — เรียงจาก minValue และต้องมีช่วงล่างสุดเสมอ';

-- One student's final grade. No courseId: Student already carries it, and one
-- enrolment gets one grade, which is what the unique key on studentId says.
CREATE TABLE StudentGrade (
    id             VARCHAR(30)   NOT NULL,
    studentId      VARCHAR(30)   NOT NULL,
    -- Frozen at grading time (CR-05), not read through to Score: editing a raw
    -- score afterwards must not silently move a grade already awarded.
    totalPercent   DOUBLE        NOT NULL COMMENT 'คะแนนรวมถ่วงน้ำหนัก (0-100)',
    grade          VARCHAR(5)    NOT NULL,
    -- NULL = the grade the ladder produced · non-null = an instructor changed it
    -- and said why. The reason IS the record that it was changed, so there is no
    -- separate isOverridden flag for the two to disagree about.
    overrideReason VARCHAR(1000) NULL COMMENT 'ระบุเหตุผลเสมอเมื่อปรับเกรดด้วยมือ',
    PRIMARY KEY (id),
    UNIQUE KEY uq_studentgrade_student (studentId),
    CONSTRAINT fk_studentgrade_student
        FOREIGN KEY (studentId) REFERENCES Student (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='เกรดสุดท้ายรายคน — ปรับมือได้แต่ต้องระบุเหตุผล';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ตามรอยการนำเข้าคะแนน — ใครทำ เมื่อไร ด้วยไฟล์อะไร';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- END — 13 tables · 16 foreign keys · 0 deferred FKs
--
-- Every FK points at a table already created above it, so the file runs
-- top-to-bottom even with FOREIGN_KEY_CHECKS ON. StudentGrade is declared after
-- both GradeRun and Student for exactly this reason; keep that order if you
-- add anything.
--
-- MySQL Workbench:
--   1. File > Import > Reverse Engineer MySQL Create Script...
--   2. Select this file · tick "Place imported objects on a diagram"
--   3. Arrange > Autolayout. The two Grade* tables need no special handling now:
--      GradeBand hangs off Course and StudentGrade off Student, one edge each.
--   4. Table comments above show as descriptions in the EER model; turn them on
--      with View > Object Descriptions if the canvas looks bare.
--
-- Expected diagram shape: Course sits in the middle with six things hanging off
-- it (CourseInstructor, CLO, Activity, Student, ScoreUploadLog, GradeBand). If
-- Course is NOT the busiest node, the import failed or an FK was dropped.
-- ============================================================================
