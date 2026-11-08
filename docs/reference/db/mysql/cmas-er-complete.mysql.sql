-- ============================================================================
-- CMAS / CLO SYSTEM — complete data model — MySQL 8.0 dialect
--
-- Purpose : diagramming artifact for MySQL Workbench
--           File > Open SQL Script  (run it: Ctrl+Shift+Enter)  or
--           File > Import > Reverse Engineer MySQL Create Script...
--           then Model > Add Diagram, drag the tables in (Database > Reverse Engineer).
--
-- Source  : database/schema.prisma on feature/frontend-index-q
--           (migration 0001-0009, last schema change 2026-11-04)
--           18 tables · 16 enums · 26 foreign keys
--
-- Generated from the schema, not typed by hand, so it matches the page
-- "ER (complete)" of docs/diagrams/architecture/CMAS-Architecture-Overview.drawio.
-- Nothing deploys from this file. The real database is PostgreSQL; the source
-- of truth is schema.prisma. Prisma enums become MySQL ENUM columns.
--
-- NOT in this file (they live in hand-written SQL migrations, not in
-- schema.prisma): the CHECK constraints and triggers of
-- 0002_constraints_and_triggers and 0004, and the row-level security of 0009.
--
-- TARGET shape: sign-in is Google only (decision D-5), so this file leaves out
-- what schema.prisma still has but nothing uses:
--   table  EmailVerificationToken
--   column User.passwordHash · mustChangePassword · pwResetAt · pwChangedAt
--   enum   AuthEventAction: PW_RESET · PW_CHANGE · REGISTER · VERIFY · LOGIN
-- The real schema keeps them until a Prisma migration drops them.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Re-runnable: drop children before parents.
DROP TABLE IF EXISTS RefreshToken;
DROP TABLE IF EXISTS AuthEvent;
DROP TABLE IF EXISTS ScoreChange;
DROP TABLE IF EXISTS RemediationPlan;
DROP TABLE IF EXISTS UploadReject;
DROP TABLE IF EXISTS CourseGroupWeight;
DROP TABLE IF EXISTS StudentGrade;
DROP TABLE IF EXISTS GradeBand;
DROP TABLE IF EXISTS ScoreUploadLog;
DROP TABLE IF EXISTS Score;
DROP TABLE IF EXISTS Student;
DROP TABLE IF EXISTS AssessmentCriteria;
DROP TABLE IF EXISTS Activity;
DROP TABLE IF EXISTS BehavioralObjective;
DROP TABLE IF EXISTS CLO;
DROP TABLE IF EXISTS CourseInstructor;
DROP TABLE IF EXISTS Course;
DROP TABLE IF EXISTS `User`;

CREATE TABLE `User` (
    id                    VARCHAR(30) NOT NULL,
    email                 VARCHAR(255) NOT NULL,
    name                  VARCHAR(255) NOT NULL,
    role                  ENUM('ADMIN','INSTRUCTOR') NOT NULL DEFAULT 'INSTRUCTOR',
    isActive              TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'account kill switch (FR-03)',
    status                ENUM('PENDING','ACTIVE') NOT NULL DEFAULT 'ACTIVE',
    authProvider          ENUM('EMAIL','GOOGLE') NOT NULL DEFAULT 'EMAIL',
    googleSub             VARCHAR(255) NULL,
    emailVerifiedAt       DATETIME(3) NULL,
    createdAt             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_email (email),
    UNIQUE KEY uq_user_googlesub (googleSub),
    KEY idx_user_role_isactive (role, isActive),
    KEY idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Course (
    id                    VARCHAR(30) NOT NULL,
    code                  VARCHAR(255) NOT NULL,
    name                  VARCHAR(255) NOT NULL COMMENT 'ชื่อไทย',
    nameEn                VARCHAR(255) NULL,
    semester              INT NOT NULL COMMENT '1..3 — bounded at the Zod layer, coarse CHECK 1-6 at the DB',
    `year`                INT NOT NULL COMMENT 'พ.ศ. as entered by the faculty',
    section               VARCHAR(255) NOT NULL DEFAULT '01',
    credits               DECIMAL(3,1) NOT NULL DEFAULT 3,
    lectureHours          DECIMAL(4,1) NOT NULL DEFAULT 0,
    practiceHours         DECIMAL(4,1) NOT NULL DEFAULT 0,
    selfStudyHours        DECIMAL(4,1) NOT NULL DEFAULT 0,
    gradeScale            ENUM('LETTER','PASS_FAIL') NOT NULL DEFAULT 'LETTER',
    gradeMethod           ENUM('CRITERION_REFERENCED','NORM_REFERENCED') NOT NULL DEFAULT 'CRITERION_REFERENCED',
    passCriteria          DOUBLE NOT NULL DEFAULT 60 COMMENT 'เกณฑ์คะแนนรวมที่ถือว่านักศึกษาผ่านวิชา (%)',
    cloPassMark           DOUBLE NOT NULL DEFAULT 60,
    classTarget           DOUBLE NOT NULL DEFAULT 100 COMMENT 'สัดส่วนนักศึกษาที่ต้องผ่าน CLO จึงถือว่าบรรลุ (%) · D2: เป้าคือทุกคนผ่าน',
    createdAt             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    weightMode            ENUM('MANUAL','GROUP') NOT NULL DEFAULT 'MANUAL',
    PRIMARY KEY (id),
    UNIQUE KEY uq_course_code_semester_year_section (code, semester, `year`, section),
    KEY idx_course_year_semester (`year`, semester),
    KEY idx_course_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE CourseInstructor (
    id                    VARCHAR(30) NOT NULL,
    courseId              VARCHAR(30) NOT NULL,
    userId                VARCHAR(30) NOT NULL,
    assignedAt            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_courseinstructor_courseid_userid (courseId, userId),
    KEY idx_courseinstructor_userid (userId),
    CONSTRAINT fk_courseinstructor_courseid
        FOREIGN KEY (courseId) REFERENCES Course (id) ON DELETE CASCADE,
    CONSTRAINT fk_courseinstructor_userid
        FOREIGN KEY (userId) REFERENCES `User` (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE CLO (
    id                    VARCHAR(30) NOT NULL,
    courseId              VARCHAR(30) NOT NULL,
    `number`              INT NOT NULL,
    description           TEXT NOT NULL,
    weight                DOUBLE NULL,
    levelSource           ENUM('AUTO','MANUAL') NOT NULL DEFAULT 'AUTO',
    bloomLevel            ENUM('REMEMBER','UNDERSTAND','APPLY','ANALYZE','EVALUATE','CREATE') NULL,
    soloLevel             ENUM('SURFACE','DEEP','TRANSFER') NULL,
    classTarget           DOUBLE NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_clo_courseid_number (courseId, `number`),
    CONSTRAINT fk_clo_courseid
        FOREIGN KEY (courseId) REFERENCES Course (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE BehavioralObjective (
    id                    VARCHAR(30) NOT NULL,
    cloId                 VARCHAR(30) NOT NULL,
    `number`              INT NOT NULL,
    description           TEXT NOT NULL,
    weight                DOUBLE NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_behavioralobjective_cloid_number (cloId, `number`),
    CONSTRAINT fk_behavioralobjective_cloid
        FOREIGN KEY (cloId) REFERENCES CLO (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Activity (
    id                    VARCHAR(30) NOT NULL,
    courseId              VARCHAR(30) NOT NULL,
    name                  VARCHAR(255) NOT NULL,
    `type`                ENUM('LECTURE','LAB','TEST','PROJECT','OTHER','CUSTOM') NOT NULL DEFAULT 'TEST',
    assessmentMethod      ENUM('QUIZ','EXAM','RUBRIC','WORK','OBSERVATION','OTHER','CUSTOM') NOT NULL DEFAULT 'EXAM',
    criteriaNote          VARCHAR(500) NOT NULL DEFAULT '' COMMENT 'เกณฑ์การประเมิน / รูบริก, free text',
    passMark              DOUBLE NOT NULL DEFAULT 50 COMMENT '% of maxScore that passes THIS activity — reported, never decides a CLO',
    maxScore              DOUBLE NOT NULL COMMENT 'must be > 0 — every attainment formula divides by it',
    `order`               INT NOT NULL,
    weight                DOUBLE NOT NULL COMMENT '% of the course total; all activities in a course sum to 100',
    typeLabel             VARCHAR(255) NOT NULL DEFAULT '',
    assessmentLabel       VARCHAR(255) NOT NULL DEFAULT '',
    passScore             DOUBLE NULL,
    closedAt              DATE NULL,
    PRIMARY KEY (id),
    KEY idx_activity_courseid_order (courseId, `order`),
    CONSTRAINT fk_activity_courseid
        FOREIGN KEY (courseId) REFERENCES Course (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE AssessmentCriteria (
    id                    VARCHAR(30) NOT NULL,
    activityId            VARCHAR(30) NOT NULL,
    objectiveId           VARCHAR(30) NOT NULL,
    weight                DOUBLE NOT NULL COMMENT '% of THIS activity that measures THIS objective; sums to 100 per activity',
    PRIMARY KEY (id),
    UNIQUE KEY uq_assessmentcriteria_activityid_objectiveid (activityId, objectiveId),
    KEY idx_assessmentcriteria_objectiveid (objectiveId),
    CONSTRAINT fk_assessmentcriteria_activityid
        FOREIGN KEY (activityId) REFERENCES Activity (id) ON DELETE CASCADE,
    CONSTRAINT fk_assessmentcriteria_objectiveid
        FOREIGN KEY (objectiveId) REFERENCES BehavioralObjective (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Student (
    id                    VARCHAR(30) NOT NULL,
    studentCode           VARCHAR(255) NOT NULL,
    name                  VARCHAR(255) NOT NULL,
    courseId              VARCHAR(30) NOT NULL,
    status                ENUM('ENROLLED','WITHDRAWN') NOT NULL DEFAULT 'ENROLLED',
    withdrawnAt           DATE NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_student_studentcode_courseid (studentCode, courseId),
    KEY idx_student_studentcode (studentCode),
    KEY idx_student_courseid (courseId),
    CONSTRAINT fk_student_courseid
        FOREIGN KEY (courseId) REFERENCES Course (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Score (
    id                    VARCHAR(30) NOT NULL,
    studentId             VARCHAR(30) NOT NULL,
    activityId            VARCHAR(30) NOT NULL,
    score                 DOUBLE NULL,
    status                ENUM('SCORED','EXCUSED') NOT NULL DEFAULT 'SCORED',
    excuseReason          VARCHAR(500) NULL,
    uploadedAt            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_score_studentid_activityid (studentId, activityId),
    KEY idx_score_activityid (activityId),
    CONSTRAINT fk_score_studentid
        FOREIGN KEY (studentId) REFERENCES Student (id) ON DELETE CASCADE,
    CONSTRAINT fk_score_activityid
        FOREIGN KEY (activityId) REFERENCES Activity (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ScoreUploadLog (
    id                    VARCHAR(30) NOT NULL,
    courseId              VARCHAR(30) NOT NULL,
    uploadedBy            VARCHAR(30) NOT NULL,
    fileName              VARCHAR(255) NOT NULL,
    recordsOk             INT NOT NULL,
    recordsFail           INT NOT NULL,
    kind                  ENUM('SCORE','ROSTER') NOT NULL DEFAULT 'SCORE' COMMENT '0008',
    createdAt             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY idx_scoreuploadlog_courseid (courseId),
    KEY idx_scoreuploadlog_createdat (createdAt),
    KEY idx_scoreuploadlog_uploadedby (uploadedBy),
    CONSTRAINT fk_scoreuploadlog_courseid
        FOREIGN KEY (courseId) REFERENCES Course (id) ON DELETE CASCADE,
    CONSTRAINT fk_scoreuploadlog_uploadedby
        FOREIGN KEY (uploadedBy) REFERENCES `User` (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE GradeBand (
    id                    VARCHAR(30) NOT NULL,
    courseId              VARCHAR(30) NOT NULL,
    grade                 VARCHAR(255) NOT NULL COMMENT '''A'',''B+'',... or ''S'',''U''',
    minValue              DOUBLE NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_gradeband_courseid_grade (courseId, grade),
    UNIQUE KEY uq_gradeband_courseid_minvalue (courseId, minValue),
    CONSTRAINT fk_gradeband_courseid
        FOREIGN KEY (courseId) REFERENCES Course (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE StudentGrade (
    id                    VARCHAR(30) NOT NULL,
    studentId             VARCHAR(30) NOT NULL,
    totalPercent          DOUBLE NOT NULL,
    grade                 VARCHAR(255) NOT NULL,
    overrideReason        VARCHAR(500) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_studentgrade_studentid (studentId),
    CONSTRAINT fk_studentgrade_studentid
        FOREIGN KEY (studentId) REFERENCES Student (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE CourseGroupWeight (
    id                    VARCHAR(30) NOT NULL,
    courseId              VARCHAR(30) NOT NULL,
    `type`                VARCHAR(255) NOT NULL,
    weight                DOUBLE NOT NULL COMMENT '% of the course total for ALL activities of this type',
    PRIMARY KEY (id),
    UNIQUE KEY uq_coursegroupweight_courseid_type (courseId, `type`),
    CONSTRAINT fk_coursegroupweight_courseid
        FOREIGN KEY (courseId) REFERENCES Course (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE UploadReject (
    id                    VARCHAR(30) NOT NULL,
    logId                 VARCHAR(30) NOT NULL,
    `row`                 INT NOT NULL,
    studentCode           VARCHAR(255) NOT NULL,
    `field`               VARCHAR(255) NOT NULL,
    `value`               VARCHAR(500) NOT NULL,
    reason                VARCHAR(500) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_uploadreject_logid (logId),
    CONSTRAINT fk_uploadreject_logid
        FOREIGN KEY (logId) REFERENCES ScoreUploadLog (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE RemediationPlan (
    id                    VARCHAR(30) NOT NULL,
    studentId             VARCHAR(30) NOT NULL,
    cloId                 VARCHAR(30) NOT NULL,
    `plan`                TEXT NOT NULL,
    updatedBy             VARCHAR(30) NOT NULL,
    updatedAt             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_remediationplan_studentid_cloid (studentId, cloId),
    KEY idx_remediationplan_cloid (cloId),
    KEY idx_remediationplan_updatedby (updatedBy),
    CONSTRAINT fk_remediationplan_studentid
        FOREIGN KEY (studentId) REFERENCES Student (id) ON DELETE CASCADE,
    CONSTRAINT fk_remediationplan_cloid
        FOREIGN KEY (cloId) REFERENCES CLO (id) ON DELETE CASCADE,
    CONSTRAINT fk_remediationplan_updatedby
        FOREIGN KEY (updatedBy) REFERENCES `User` (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ScoreChange (
    id                    VARCHAR(30) NOT NULL,
    studentId             VARCHAR(30) NOT NULL,
    activityId            VARCHAR(30) NOT NULL,
    fromScore             DOUBLE NULL,
    fromExcused           TINYINT(1) NOT NULL DEFAULT 0,
    toScore               DOUBLE NULL,
    toExcused             TINYINT(1) NOT NULL DEFAULT 0,
    source                ENUM('MANUAL','IMPORT','FILL','FILL_UNDO','CLOSE','PASTE','NOTE','UNDO') NOT NULL,
    note                  VARCHAR(500) NULL,
    changedBy             VARCHAR(30) NOT NULL,
    logId                 VARCHAR(30) NULL,
    changedAt             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY idx_scorechange_studentid_activityid_changedat (studentId, activityId, changedAt),
    KEY idx_scorechange_activityid (activityId),
    KEY idx_scorechange_changedby (changedBy),
    KEY idx_scorechange_logid (logId),
    CONSTRAINT fk_scorechange_studentid
        FOREIGN KEY (studentId) REFERENCES Student (id) ON DELETE CASCADE,
    CONSTRAINT fk_scorechange_activityid
        FOREIGN KEY (activityId) REFERENCES Activity (id) ON DELETE CASCADE,
    CONSTRAINT fk_scorechange_changedby
        FOREIGN KEY (changedBy) REFERENCES `User` (id) ON DELETE RESTRICT,
    CONSTRAINT fk_scorechange_logid
        FOREIGN KEY (logId) REFERENCES ScoreUploadLog (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE AuthEvent (
    id                    VARCHAR(30) NOT NULL,
    userId                VARCHAR(30) NOT NULL,
    actorId               VARCHAR(30) NOT NULL,
    action                ENUM('CREATE','EDIT','ROLE_SET','SUSPEND','ACTIVATE','DENY','LOGIN_GOOGLE','LOGOUT') NOT NULL,
    detail                VARCHAR(500) NULL,
    `at`                  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY idx_authevent_userid_at (userId, `at`),
    KEY idx_authevent_actorid (actorId),
    CONSTRAINT fk_authevent_userid
        FOREIGN KEY (userId) REFERENCES `User` (id) ON DELETE CASCADE,
    CONSTRAINT fk_authevent_actorid
        FOREIGN KEY (actorId) REFERENCES `User` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE RefreshToken (
    id                    VARCHAR(30) NOT NULL,
    userId                VARCHAR(30) NOT NULL,
    tokenHash             VARCHAR(255) NOT NULL,
    familyId              VARCHAR(30) NOT NULL,
    expiresAt             DATETIME(3) NOT NULL,
    revokedAt             DATETIME(3) NULL,
    replacedBy            VARCHAR(255) NULL,
    createdAt             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_refreshtoken_tokenhash (tokenHash),
    KEY idx_refreshtoken_userid (userId),
    KEY idx_refreshtoken_familyid (familyId),
    CONSTRAINT fk_refreshtoken_userid
        FOREIGN KEY (userId) REFERENCES `User` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- END — 18 tables · 26 foreign keys
-- ============================================================================
