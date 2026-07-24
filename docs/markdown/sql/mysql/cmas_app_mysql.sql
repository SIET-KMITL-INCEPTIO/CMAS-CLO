-- ============================================================================
-- CMAS / CLO SYSTEM — Application Schema — MySQL 8.0 dialect
-- Mirrors what the running app uses today.
--
-- Source of truth : database/schema.prisma (Prisma, provider = postgresql)
-- This file        : hand-translated to MySQL 8 for MySQL Workbench "Reverse
--                    Engineer" -> EER diagram.
--
-- Translation notes (Prisma/Postgres -> MySQL 8):
--   @id @default(cuid())  -> VARCHAR(30) PK (cuid is a ~25-char string;
--                            the app generates the value, so no AUTO_INCREMENT)
--   enum Role             -> ENUM('ADMIN','INSTRUCTOR')
--   String                -> VARCHAR(255) (email VARCHAR(255) UNIQUE)
--   Float                 -> DOUBLE
--   Int / Boolean         -> INT / TINYINT(1)
--   DateTime @default(now)-> DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
--   @@unique([...])       -> UNIQUE KEY
--   Reserved word "order" -> back-ticked `order`
--   InnoDB + utf8mb4 for Thai text; FKs are table-level so Workbench draws them.
--
-- Note: ScoreUploadLog has no relations in the Prisma model (courseId /
-- uploadedBy are plain strings, not FKs) — kept as a standalone audit table,
-- matching the source.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE User (
    id           VARCHAR(30)  NOT NULL,
    email        VARCHAR(255) NOT NULL,
    name         VARCHAR(255) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    role         ENUM('ADMIN','INSTRUCTOR') NOT NULL DEFAULT 'INSTRUCTOR',
    isActive     TINYINT(1)   NOT NULL DEFAULT 1,
    createdAt    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Curriculum (
    id          VARCHAR(30)  NOT NULL,
    name        VARCHAR(255) NOT NULL,
    year        INT          NOT NULL,
    institution VARCHAR(255) NOT NULL,
    clonedFrom  VARCHAR(30)  NULL,
    createdAt   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE CurriculumCourse (
    id             VARCHAR(30)  NOT NULL,
    curriculumId   VARCHAR(30)  NOT NULL,
    courseId       VARCHAR(30)  NULL,
    courseCode     VARCHAR(50)  NOT NULL,
    courseName     VARCHAR(255) NOT NULL,
    courseNameEn   VARCHAR(255) NULL,
    -- "3 (2-2-5)" = credits (lecture-practice-selfStudy). DECIMAL, not INT:
    -- the curriculum contains 0-credit prerequisites such as 90641008
    -- "0 (0-0-45)", which an INT column with a 1..30 floor rejected outright.
    credits        DECIMAL(3,1) NOT NULL,
    lectureHours   DECIMAL(4,1) NOT NULL DEFAULT 0,
    practiceHours  DECIMAL(4,1) NOT NULL DEFAULT 0,
    selfStudyHours DECIMAL(4,1) NOT NULL DEFAULT 0,
    -- Courses 90641004-90641010 are graded ผ่าน (S) / ไม่ผ่าน (U).
    gradingType    ENUM('LETTER','PASS_FAIL') NOT NULL DEFAULT 'LETTER',
    PRIMARY KEY (id),
    UNIQUE KEY uq_curriculumcourse_code (curriculumId, courseCode),
    KEY idx_curriculumcourse_curriculum (curriculumId),
    KEY idx_curriculumcourse_course (courseId),
    CONSTRAINT fk_curriculumcourse_curriculum
        FOREIGN KEY (curriculumId) REFERENCES Curriculum (id)
    -- fk_curriculumcourse_course is added by ALTER TABLE at the end of the
    -- file, because Course is created after this table. Declaring it inline
    -- would only work with FOREIGN_KEY_CHECKS = 0.
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Course (
    id       VARCHAR(30)  NOT NULL,
    code     VARCHAR(50)  NOT NULL,
    name     VARCHAR(255) NOT NULL,
    semester INT          NOT NULL,
    year     INT          NOT NULL,
    -- Section discriminator. Teaching is M:N now, so instructorId can no
    -- longer act as the thing that separates two offerings of one course.
    section  VARCHAR(10)  NOT NULL DEFAULT '01',
    PRIMARY KEY (id),
    UNIQUE KEY uq_course_offering (code, semester, year, section),
    KEY idx_course_term (year, semester)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Many instructors teach many courses; `role` is a property of the pairing.
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
        FOREIGN KEY (userId) REFERENCES User (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE CLO (
    id          VARCHAR(30)   NOT NULL,
    courseId    VARCHAR(30)   NOT NULL,
    number      INT           NOT NULL,
    description VARCHAR(1000) NOT NULL,
    threshold   DOUBLE        NOT NULL DEFAULT 60,
    PRIMARY KEY (id),
    UNIQUE KEY uq_clo_course_number (courseId, number),
    KEY idx_clo_course (courseId),
    CONSTRAINT fk_clo_course
        FOREIGN KEY (courseId) REFERENCES Course (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- No PLO layer here by design. This schema stops at the course level: the
-- unit of analysis is the CLO and its behavioural objectives. Programme-level
-- outcomes and the CLO->PLO roll-up live in cmas_enterprise_mysql.sql.

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
    CONSTRAINT fk_activity_course
        FOREIGN KEY (courseId) REFERENCES Course (id)
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
        FOREIGN KEY (activityId) REFERENCES Activity (id),
    CONSTRAINT fk_criteria_clo
        FOREIGN KEY (cloId) REFERENCES CLO (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Traceability only: records WHICH behavioural objectives a criterion provides
-- evidence for. Attaches to AssessmentCriteria, not Activity, so the CLO score
-- calculation is completely unaffected by whether objectives are mapped.
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

CREATE TABLE Student (
    id          VARCHAR(30)  NOT NULL,
    studentCode VARCHAR(50)  NOT NULL,
    name        VARCHAR(255) NOT NULL,
    courseId    VARCHAR(30)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_student_code_course (studentCode, courseId),
    KEY idx_student_course (courseId),
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
    CONSTRAINT fk_uploadlog_course
        FOREIGN KEY (courseId) REFERENCES Course (id),
    CONSTRAINT fk_uploadlog_user
        FOREIGN KEY (uploadedBy) REFERENCES User (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deferred FK: CurriculumCourse -> Course (Course is created after it).
ALTER TABLE CurriculumCourse
    ADD CONSTRAINT fk_curriculumcourse_course
        FOREIGN KEY (courseId) REFERENCES Course (id);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- END — 13 tables, 16 foreign keys. Reverse-engineer in MySQL Workbench:
--   File > Import > Reverse Engineer MySQL Create Script...  (select this file)
--
-- Changes from the original 11-table version, all traced to either the Prisma
-- model or the 2567 curriculum document:
--   + CourseInstructor    instructors are M:N; Course.instructorId is gone and
--                         Course.section took over its role in the unique key
--   + ObjectiveAssessment behavioural objectives are no longer a dead end
--   ~ CurriculumCourse    credits DECIMAL(3,1) + lecture/practice/selfStudy
--                         hours ("3 (2-2-5)"), gradingType for S/U courses,
--                         and a real FK to Course
--   ~ ScoreUploadLog      courseId / uploadedBy are proper foreign keys
--
-- This file mirrors database/schema.prisma for diagramming. The executable
-- schema — cascade rules, CHECK constraints, triggers and reporting views —
-- is cmas_app_production.sql.
-- ============================================================================
