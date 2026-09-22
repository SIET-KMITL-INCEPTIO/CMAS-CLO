-- ============================================================================
-- CMAS / CLO SYSTEM — ER model of index-q.html — MySQL 8.0 dialect
--
-- Purpose : diagramming artifact for MySQL Workbench
--           File > Import > Reverse Engineer MySQL Create Script...
--
-- What this is: the data model the UI prototype docs/pages/index-q.html
-- actually runs on. Its baseline is database/schema.prisma as of migration
-- 0006 (revised 2569-09-18 — it was v4 copied verbatim until then), plus the
-- deltas the prototype needs that Prisma does not have yet. Every delta is
-- tagged [index-q] at its definition and in its COMMENT, so the EER diagram
-- shows what is proposed without this header open beside it.
--
-- Source of truth is still database/schema.prisma. Nothing deploys from this
-- file. The [index-q] parts are PROPOSALS: they become real only when a
-- Prisma migration adds them.
--
-- ============================================================================
-- WHAT CHANGED SINCE v4 — ALREADY IN schema.prisma (not tagged)
-- ----------------------------------------------------------------------------
--   0005  D1  CourseInstructor.role DROPPED — one course role, equal rights
--         D4  CLO.soloLevel (SURFACE / DEEP / TRANSFER) beside bloomLevel
--         D6  self-registration: User.authProvider · googleSub · emailVerifiedAt,
--             passwordHash nullable (Google-only accounts), EmailVerificationToken NEW
--   0006  T4  AssessmentCriteria re-pointed Activity <-> BehavioralObjective
--             (was Activity <-> CLO). ObjectiveAssessment DROPPED — merged in.
--         T1  CLO.weight · E3 CLO.levelSource · T6 BehavioralObjective.weight
--         T7  CLO.threshold DROPPED -> E1 Course.cloPassMark (one per course)
--         T3  Activity.method DROPPED -> type · assessmentMethod · criteriaNote
--             · passMark
--         D2  Course.classTarget default 70 -> 100
--
-- WHAT index-q.html ADDS ON TOP — 15 tables · 18 FKs
-- ----------------------------------------------------------------------------
--   UploadReject   NEW  one row per refused cell of an Excel import (FR-65)
--   AuthEvent      NEW  account history incl. refused actions (UC 1.6, FR-22b)
--                       and the self-registration trail (REGISTER, VERIFY, LOGIN*)
--   User           +3   mustChangePassword · pwResetAt · pwChangedAt (UC 1.5)
--   ScoreUploadLog +1   kind — the roster import is logged here too (UC 7.1)
--
-- AND TWO THINGS IT DELIBERATELY DOES NOT ADD
--   index-q.html keeps grade overrides in a separate map, db.override. That is
--   a prototype convenience, not a table: StudentGrade.overrideReason already
--   holds exactly that record. Fold it back in; do not create an Override table.
--   index-q.html still writes role:'INSTRUCTOR' on every courseInstructor row.
--   It is a constant with one legal value; the column is gone (D1), not kept.
--
-- ============================================================================
-- AUTHORIZATION — enforced in the APP, not in SQL (revised 2569-09-18)
-- ----------------------------------------------------------------------------
-- D1 (2569-09-14) retired LEAD / CO / ASSISTANT. The PERM matrix in
-- index-q.html now has three kinds of row:
--
--   INSTRUCTOR of THIS course   every capability inside the course — scores,
--                               imports, students, activities, CLOs, bands,
--                               grading, overrides, settings, deletes.
--                               Also adds/removes other instructors (P14),
--                               deletes the course (P16).
--   ANY ACTIVE INSTRUCTOR       creates a course and is put on it (P17).
--   ADMIN                       user accounts (P18), creates/deletes any course,
--                               appoints instructors — never a course's contents.
--
-- Anyone at the faculty domain may register (D6) — by email + verification
-- link, or by Google. A new account is always INSTRUCTOR and on no course.
--
-- None of the above is expressible in SQL — SQL has no concept of who is
-- asking. It lives in the rbac middleware and the course-access service.
--
-- ============================================================================
-- MYSQL DIALECT NOTES — unchanged from v4
-- ----------------------------------------------------------------------------
--   cuid PK -> VARCHAR(30) · enums inline · DOUBLE · DATETIME(3) · TINYINT(1)
--   Reserved words back-ticked: `User`, `order`, `row`, `at`
--   No ON DELETE actions, CHECKs or triggers — those live in the Prisma
--   migrations (0002, 0004, 0005, 0006). This file exists so the EER draws cleanly.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- OPTIONAL teardown for re-importing over an existing model. DESTRUCTIVE —
-- uncomment only against a scratch schema, never anything holding data.
-- DROP TABLE IF EXISTS UploadReject, AuthEvent, StudentGrade, GradeBand,
--                      ScoreUploadLog, Score, Student,
--                      AssessmentCriteria, Activity, BehavioralObjective,
--                      CLO, CourseInstructor, Course,
--                      EmailVerificationToken, `User`;

-- ----------------------------------------------------------------------------
-- IDENTITY
-- ----------------------------------------------------------------------------

CREATE TABLE `User` (
    id           VARCHAR(30)  NOT NULL,
    email        VARCHAR(255) NOT NULL   COMMENT 'one human, one credential',
    name         VARCHAR(255) NOT NULL,
    -- NULL for an account that only ever signs in with Google (D6). Migration
    -- 0005 CHECKs that at least one of passwordHash / googleSub is present.
    passwordHash VARCHAR(255) NULL       COMMENT 'argon2id only — NULL = Google-only account',
    role         ENUM('ADMIN','INSTRUCTOR') NOT NULL DEFAULT 'INSTRUCTOR',
    isActive     TINYINT(1)   NOT NULL DEFAULT 1
                              COMMENT 'kill switch — never hard-delete a User',

    -- Self-registration (D6). An EMAIL account cannot sign in until verified.
    authProvider ENUM('EMAIL','GOOGLE') NOT NULL DEFAULT 'EMAIL'
                              COMMENT 'how the account was first created',
    googleSub    VARCHAR(255) NULL    COMMENT 'Google subject id from the VERIFIED token — matched on, never the email',
    emailVerifiedAt DATETIME(3) NULL  COMMENT 'NULL = รอยืนยันอีเมล · Google sets it on creation',

    -- [index-q] UC 1.5 รีเซ็ตรหัสผ่าน and the self-service change-password form.
    -- A reset without this flag cannot force the next login to pick a new
    -- password, which is the whole point of issuing a temporary one.
    mustChangePassword TINYINT(1) NOT NULL DEFAULT 0
                              COMMENT '[index-q] ต้องตั้งรหัสใหม่ก่อนใช้งานต่อ — ตั้งโดยการรีเซ็ต',
    pwResetAt    DATETIME(3)  NULL    COMMENT '[index-q] ผู้ดูแลรีเซ็ตล่าสุดเมื่อ',
    pwChangedAt  DATETIME(3)  NULL    COMMENT '[index-q] เจ้าของบัญชีเปลี่ยนรหัสล่าสุดเมื่อ',
    createdAt    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                              ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_email (email),
    UNIQUE KEY uq_user_googlesub (googleSub),
    -- Composite, not two single-column keys: every user list filters by BOTH
    -- ("active instructors", "active admins") and never by role alone.
    KEY idx_user_role_active (role, isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ผู้ใช้ระบบ — ADMIN หรือ INSTRUCTOR (ไม่มี role นักศึกษา) · ลงทะเบียนเองได้ (D6)';

-- The link an EMAIL registration is verified by (D6). Only the hash is stored,
-- so a leaked table cannot be replayed; usedAt makes the link single-use.
CREATE TABLE EmailVerificationToken (
    id        VARCHAR(30)  NOT NULL,
    userId    VARCHAR(30)  NOT NULL,
    tokenHash VARCHAR(255) NOT NULL COMMENT 'SHA-256 of 32 random bytes — the raw token only ever lives in the email',
    expiresAt DATETIME(3)  NOT NULL,
    usedAt    DATETIME(3)  NULL     COMMENT 'set on first use — the same link opened twice verifies once',
    createdAt DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_emailtoken_hash (tokenHash),
    KEY idx_emailtoken_user (userId),
    CONSTRAINT fk_emailtoken_user
        FOREIGN KEY (userId) REFERENCES `User` (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ลิงก์ยืนยันอีเมลตอนลงทะเบียน — ใช้ได้ครั้งเดียว มีวันหมดอายุ';

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
    -- E1: ONE pass mark for every CLO of the course, replacing CLO.threshold.
    cloPassMark    DOUBLE       NOT NULL DEFAULT 60
                                COMMENT 'เกณฑ์ผ่าน CLO รายคน (%) — ค่าเดียวทั้งวิชา',
    classTarget    DOUBLE       NOT NULL DEFAULT 100
                                COMMENT 'สัดส่วนผู้ผ่าน CLO จึงถือว่าบรรลุ (%) — D2 ทุกคนผ่าน · CLO may override',

    createdAt      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_course_offering (code, semester, year, section),
    KEY idx_course_term (year, semester),
    KEY idx_course_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='รายวิชา 1 แถว = 1 หมู่เรียน — รากของลำดับชั้นข้อมูลทั้งหมด';

-- Many instructors teach many courses. There is no `role` column any more
-- (D1): every instructor on a course holds the same rights, so the pairing
-- carries nothing but when it was made.
CREATE TABLE CourseInstructor (
    id         VARCHAR(30) NOT NULL,
    courseId   VARCHAR(30) NOT NULL,
    userId     VARCHAR(30) NOT NULL,
    assignedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_courseinstructor_pair (courseId, userId),
    KEY idx_courseinstructor_user (userId),
    CONSTRAINT fk_courseinstructor_course
        FOREIGN KEY (courseId) REFERENCES Course (id),
    CONSTRAINT fk_courseinstructor_user
        FOREIGN KEY (userId) REFERENCES `User` (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='มอบหมายผู้สอน — ผู้สอนทุกคนในรายวิชามีสิทธิ์เท่ากัน (D1) · ADMIN หรือผู้สอนของวิชาเพิ่ม/ถอดได้';

-- ----------------------------------------------------------------------------
-- LEARNING OUTCOMES
-- ----------------------------------------------------------------------------

CREATE TABLE CLO (
    id          VARCHAR(30)   NOT NULL,
    courseId    VARCHAR(30)   NOT NULL,
    number      INT           NOT NULL,
    description VARCHAR(1000) NOT NULL,
    -- T1 / E2: entered by the instructor, CLOs of a course sum to 100. The
    -- share implied by the activity weights is computed and compared — a
    -- mismatch warns, it does not block. (threshold was removed by T7.)
    weight      DOUBLE        NULL
                              COMMENT 'สัดส่วนของ CLO ในรายวิชา (%) — รวม 100 ต่อวิชา · NULL = ยังไม่กรอก',
    levelSource ENUM('AUTO','MANUAL') NOT NULL DEFAULT 'AUTO'
                              COMMENT 'AUTO = ระบบเสนอ Bloom/SOLO จากคำกริยาแรก (E3) · MANUAL = ผู้สอนกำหนด',

    -- Nullable and WITHOUT a default: the column exists to check that
    -- assessment method matches cognitive level, and a fabricated REMEMBER on
    -- every legacy row would quietly defeat that.
    bloomLevel  ENUM('REMEMBER','UNDERSTAND','APPLY',
                     'ANALYZE','EVALUATE','CREATE') NULL
                              COMMENT 'ระดับพฤติกรรมตาม Bloom — จำ/เข้าใจ/ประยุกต์/วิเคราะห์/ประเมิน/สร้างสรรค์',
    -- D4. Nullable for the same reason as bloomLevel.
    soloLevel   ENUM('SURFACE','DEEP','TRANSFER') NULL
                              COMMENT 'ระดับ SOLO — พื้นผิว/เชิงลึก/ต่อยอด',

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
    weight      DOUBLE        NULL COMMENT 'T6 · สัดส่วนใน CLO ของมัน (%) — รวม 100 ต่อ CLO',
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
    -- T3 / T11: the free-text `method` split into what the activity IS and how
    -- it is marked; the old text survives as the start of criteriaNote.
    type     ENUM('LECTURE','LAB','TEST','PROJECT') NOT NULL DEFAULT 'TEST'
                          COMMENT 'บรรยาย · ปฏิบัติการ · สอบ · โครงงาน/ชิ้นงาน',
    assessmentMethod ENUM('QUIZ','EXAM','RUBRIC','WORK','OBSERVATION') NOT NULL DEFAULT 'EXAM'
                          COMMENT 'วิธีประเมิน',
    criteriaNote VARCHAR(1000) NOT NULL DEFAULT '' COMMENT 'เกณฑ์การประเมิน / รูบริก — ข้อความอิสระ',
    passMark DOUBLE       NOT NULL DEFAULT 50
                          COMMENT '% of maxScore that passes THIS activity — reported, never decides a CLO (E1)',
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

-- Associative entity: Activity <-> BehavioralObjective is M:N and `weight`
-- belongs to the pairing rather than to either side (T4, migration 0006).
-- A CLO's score is reached THROUGH its objectives:
--   Activity -> AssessmentCriteria -> BehavioralObjective -> CLO
-- The old Activity <-> CLO pairing and the ObjectiveAssessment trace table on
-- top of it were merged into this one table.
CREATE TABLE AssessmentCriteria (
    id          VARCHAR(30) NOT NULL,
    activityId  VARCHAR(30) NOT NULL,
    objectiveId VARCHAR(30) NOT NULL,
    weight      DOUBLE      NOT NULL COMMENT '% of THIS activity measuring THIS objective; sums to 100 per activity',
    PRIMARY KEY (id),
    UNIQUE KEY uq_criteria_activity_objective (activityId, objectiveId),
    KEY idx_criteria_objective (objectiveId),
    CONSTRAINT fk_criteria_activity
        FOREIGN KEY (activityId) REFERENCES Activity (id),
    CONSTRAINT fk_criteria_objective
        FOREIGN KEY (objectiveId) REFERENCES BehavioralObjective (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ผูก Activity กับจุดประสงค์เชิงพฤติกรรม พร้อมน้ำหนักต่อคู่ — กิจกรรมกับจุดประสงค์ต้องอยู่วิชาเดียวกัน (trigger)';

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
    recordsOk   INT          NOT NULL COMMENT 'score import: cells written · roster import: students added',
    recordsFail INT          NOT NULL,

    -- [index-q] commitImport() in index-q.html logs BOTH kinds of Excel import
    -- here: scores (UC 6.1) and the student roster (UC 7.1). v4 has no way to
    -- tell them apart, so a roster upload reads as a score upload, recordsOk
    -- means two different things, and the 7.5 error report cannot say which
    -- file its rejected rows came from. Kept as a column on this table rather
    -- than a rename or a second log table: both imports share every other field.
    kind        ENUM('SCORE','ROSTER') NOT NULL DEFAULT 'SCORE'
                             COMMENT '[index-q] ชนิดการนำเข้า — คะแนน (UC 6.1) หรือรายชื่อนักศึกษา (UC 7.1)',
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
  COMMENT='ตามรอยการนำเข้าไฟล์ Excel — ใครทำ เมื่อไร ด้วยไฟล์อะไร · คะแนนและรายชื่อ แยกด้วย kind';

-- ----------------------------------------------------------------------------
-- [index-q] PROPOSED — tables index-q.html stores that schema.prisma v4 lacks
--
-- Both sit outside the calculation path like ScoreUploadLog: no formula reads
-- them, so adding them is a migration, not a redesign. Their shapes mirror
-- db.uploadReject and db.authEvent in index-q.html field for field.
-- ----------------------------------------------------------------------------

-- Which rows of an upload were refused, and why. ScoreUploadLog keeps only the
-- COUNT in recordsFail, so the error report FR-65 describes cannot be built
-- from v4. The same table serves the score report (UC 6.5) and the roster
-- report (UC 7.5); ScoreUploadLog.kind on the parent row says which.
-- `row` is the row number as the instructor sees it in Excel — the
-- header block of the current template puts the first data row at 14.
CREATE TABLE UploadReject (
    id          VARCHAR(30)   NOT NULL,
    logId       VARCHAR(30)   NOT NULL,
    `row`       INT           NOT NULL COMMENT 'เลขแถวตามที่เห็นใน Excel',
    studentCode VARCHAR(50)   NOT NULL COMMENT 'as typed in the file — may match no Student',
    field       VARCHAR(255)  NOT NULL COMMENT 'รหัสนักศึกษา · ชื่อ-นามสกุล · หรือชื่อกิจกรรม',
    value       VARCHAR(255)  NOT NULL COMMENT 'the offending cell, verbatim',
    reason      VARCHAR(500)  NOT NULL COMMENT 'phrased as an instruction — แก้ในไฟล์แล้วนำเข้าใหม่',
    PRIMARY KEY (id),
    KEY idx_uploadreject_log (logId),
    CONSTRAINT fk_uploadreject_log
        FOREIGN KEY (logId) REFERENCES ScoreUploadLog (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='[index-q] แถวที่ถูกปฏิเสธตอนนำเข้า — ทำให้รายงานข้อผิดพลาด FR-65 สร้างได้จริง';

-- UC 1.6 ตรวจสอบประวัติการใช้งาน. userId is whom the event happened TO;
-- actorId is who DID it — the same person for PW_CHANGE, EDIT-by-self and
-- the whole self-service trail (REGISTER, VERIFY, LOGIN, LOGIN_GOOGLE,
-- LOGOUT), different for every admin action. DENY records a refused action
-- (FR-22b): the permission matrix is only auditable if refusals leave a trace.
CREATE TABLE AuthEvent (
    id       VARCHAR(30)   NOT NULL,
    userId   VARCHAR(30)   NOT NULL COMMENT 'บัญชีที่ถูกกระทำ',
    actorId  VARCHAR(30)   NOT NULL COMMENT 'ผู้กระทำ',
    action   ENUM('CREATE','EDIT','ROLE_SET','SUSPEND','ACTIVATE',
                  'PW_RESET','PW_CHANGE','DENY',
                  'REGISTER','VERIFY','LOGIN','LOGIN_GOOGLE','LOGOUT') NOT NULL,
    detail   VARCHAR(500)  NULL,
    `at`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    -- The account drawer lists one user's events newest first.
    KEY idx_authevent_user_at (userId, `at`),
    KEY idx_authevent_actor (actorId),
    CONSTRAINT fk_authevent_user
        FOREIGN KEY (userId) REFERENCES `User` (id),
    CONSTRAINT fk_authevent_actor
        FOREIGN KEY (actorId) REFERENCES `User` (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='[index-q] ประวัติเหตุการณ์กับบัญชี UC 1.6 — รวมการถูกปฏิเสธสิทธิ์ (FR-22b)';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- END — 15 tables · 18 foreign keys · 0 deferred FKs
--   13 tables as schema.prisma has them after migration 0006
--   · User (+3 columns) and ScoreUploadLog (+1 column) extended by index-q.html
--   · 2 tables proposed by index-q.html
--
-- Every FK points at a table already created above it, so the file runs
-- top-to-bottom even with FOREIGN_KEY_CHECKS ON. UploadReject comes after
-- ScoreUploadLog and AuthEvent after `User` for exactly this reason.
--
-- MySQL Workbench:
--   1. File > Import > Reverse Engineer MySQL Create Script...
--   2. Select this file · tick "Place imported objects on a diagram"
--   3. Arrange > Autolayout
--   4. View > Object Descriptions shows the COMMENTs — the [index-q] tag is how
--      the two proposed tables and four proposed columns identify themselves
--
-- Expected diagram shape: Course is still the busiest node with six tables
-- hanging off it. `User` now has five edges (CourseInstructor, ScoreUploadLog,
-- EmailVerificationToken, and AuthEvent twice — once as the subject, once as
-- the actor). AssessmentCriteria sits between Activity and BehavioralObjective,
-- so CLO reaches scores only through its objectives. UploadReject hangs off
-- ScoreUploadLog. If AuthEvent shows only one edge to `User`,
-- Workbench merged the two FKs and the diagram is lying about who did what.
-- ============================================================================
