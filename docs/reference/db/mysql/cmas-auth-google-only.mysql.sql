-- ============================================================================
-- CMAS / CLO SYSTEM — account & access model, Google sign-in only — MySQL 8.0
--
-- Purpose : diagramming artifact for MySQL Workbench
--           File > Open SQL Script, then run it (Ctrl+Shift+Enter), or
--           File > Import > Reverse Engineer MySQL Create Script...
--           to draw the ER diagram on page "ER (Google-only)" of
--           docs/diagrams/architecture/CMAS-Architecture-Overview.drawio.
--
-- What this is: the TARGET shape of the five tables that decide who may sign
-- in and what they may see, once passwords are gone (decision D-5: Google
-- only). Nothing deploys from this file. The real database is PostgreSQL and
-- database/schema.prisma is the source of truth: it still has the columns
-- listed under "REMOVED" below, so a Prisma migration has to drop them first.
--
-- ============================================================================
-- REMOVED vs docs/reference/db/mysql/index-q.sql
-- ----------------------------------------------------------------------------
--   table  EmailVerificationToken   no email registration; Google verifies the email
--   column User.passwordHash        no password is stored
--   column User.mustChangePassword  only a password reset sets it
--   column User.pwResetAt           UC 1.5 reset password
--   column User.pwChangedAt         UC 1.5 change password
--   enum   User.authProvider        'EMAIL' value dropped
--   enum   AuthEvent.action         PW_RESET, PW_CHANGE, REGISTER, VERIFY, LOGIN dropped
-- ADDED vs index-q.sql: RefreshToken (migration 0008, D-2 / S-2).
-- KEPT   User.googleSub nullable: an ADMIN can create the account before the
--        person signs in for the first time. Accounts are matched on googleSub,
--        never on the email string.
-- Course is trimmed to the columns that identify an offering; the full
-- definition is in index-q.sql.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Re-runnable: drop children before parents.
DROP TABLE IF EXISTS CourseInstructor;
DROP TABLE IF EXISTS AuthEvent;
DROP TABLE IF EXISTS RefreshToken;
DROP TABLE IF EXISTS Course;
DROP TABLE IF EXISTS `User`;

-- ----------------------------------------------------------------------------
-- IDENTITY
-- ----------------------------------------------------------------------------

CREATE TABLE `User` (
    id              VARCHAR(30)  NOT NULL,
    email           VARCHAR(255) NOT NULL   COMMENT 'one human, one account',
    name            VARCHAR(255) NOT NULL,
    role            ENUM('ADMIN','INSTRUCTOR') NOT NULL DEFAULT 'INSTRUCTOR'
                                COMMENT 'RBAC: the role decides which capabilities the account holds',
    isActive        TINYINT(1)   NOT NULL DEFAULT 1
                                COMMENT 'kill switch — never hard-delete a User',
    status          ENUM('PENDING','ACTIVE') NOT NULL DEFAULT 'ACTIVE'
                                COMMENT 'PENDING = Google outside the institution domain, waiting for an ADMIN',
    authProvider    ENUM('GOOGLE') NOT NULL DEFAULT 'GOOGLE'
                                COMMENT 'every account signs in with Google',
    googleSub       VARCHAR(255) NULL       COMMENT 'Google subject id from the VERIFIED ID token — set at first sign-in',
    emailVerifiedAt DATETIME(3)  NULL       COMMENT 'Google verifies the email; set on creation',
    createdAt       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_email (email),
    UNIQUE KEY uq_user_googlesub (googleSub),
    KEY idx_user_role_active (role, isActive),
    KEY idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ผู้ใช้ระบบ — ADMIN หรือ INSTRUCTOR · ล็อกอินด้วย Google เท่านั้น (D-5)';

-- Our own session. The browser holds the raw refresh token in an httpOnly
-- cookie; only its SHA-256 is stored. Every use rotates it: the old row is
-- revoked and names its replacement, and presenting a revoked token revokes
-- the whole family, because reuse means the token was stolen.
CREATE TABLE RefreshToken (
    id         VARCHAR(30)  NOT NULL,
    userId     VARCHAR(30)  NOT NULL,
    tokenHash  VARCHAR(255) NOT NULL COMMENT 'SHA-256 of the token — the raw value never reaches the database',
    familyId   VARCHAR(30)  NOT NULL COMMENT 'one sign-in = one family; reuse of a revoked token kills the family',
    expiresAt  DATETIME(3)  NOT NULL COMMENT '7 days after issue',
    revokedAt  DATETIME(3)  NULL,
    replacedBy VARCHAR(30)  NULL     COMMENT 'id of the token that replaced this one on rotation',
    createdAt  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_refreshtoken_hash (tokenHash),
    KEY idx_refreshtoken_user (userId),
    KEY idx_refreshtoken_family (familyId),
    CONSTRAINT fk_refreshtoken_user
        FOREIGN KEY (userId) REFERENCES `User` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='refresh token ที่เพิกถอนได้ — เก็บเฉพาะค่า hash (D-2 · S-2)';

-- userId is whom the event happened TO; actorId is who DID it (the same person
-- for LOGIN_GOOGLE and LOGOUT, different for every admin action). DENY records
-- a refused action (FR-22b) so the permission rules stay auditable.
CREATE TABLE AuthEvent (
    id       VARCHAR(30)   NOT NULL,
    userId   VARCHAR(30)   NOT NULL COMMENT 'บัญชีที่ถูกกระทำ',
    actorId  VARCHAR(30)   NOT NULL COMMENT 'ผู้กระทำ',
    action   ENUM('CREATE','EDIT','ROLE_SET','SUSPEND','ACTIVATE',
                  'DENY','LOGIN_GOOGLE','LOGOUT') NOT NULL,
    detail   VARCHAR(500)  NULL,
    `at`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY idx_authevent_user_at (userId, `at`),
    KEY idx_authevent_actor (actorId),
    CONSTRAINT fk_authevent_user
        FOREIGN KEY (userId)  REFERENCES `User` (id) ON DELETE CASCADE,
    CONSTRAINT fk_authevent_actor
        FOREIGN KEY (actorId) REFERENCES `User` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ประวัติเหตุการณ์กับบัญชี UC 1.6 — รวมการถูกปฏิเสธสิทธิ์ (FR-22b)';

-- ----------------------------------------------------------------------------
-- COURSE SCOPE — the only data boundary: an INSTRUCTOR sees a course only
-- through a CourseInstructor row; an ADMIN sees every course.
-- ----------------------------------------------------------------------------

CREATE TABLE Course (
    id        VARCHAR(30)  NOT NULL,
    code      VARCHAR(50)  NOT NULL,
    name      VARCHAR(255) NOT NULL   COMMENT 'ชื่อไทย',
    nameEn    VARCHAR(255) NULL,
    semester  INT          NOT NULL,
    year      INT          NOT NULL   COMMENT 'พ.ศ.',
    section   VARCHAR(10)  NOT NULL DEFAULT '01' COMMENT 'หมู่เรียน — one row = one section',
    createdAt DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                           ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_course_offering (code, semester, year, section),
    KEY idx_course_term (year, semester)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='รายวิชา 1 แถว = 1 หมู่เรียน (ย่อ — คอลัมน์เต็มอยู่ใน index-q.sql)';

CREATE TABLE CourseInstructor (
    id         VARCHAR(30) NOT NULL,
    courseId   VARCHAR(30) NOT NULL,
    userId     VARCHAR(30) NOT NULL,
    assignedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_courseinstructor_pair (courseId, userId),
    KEY idx_courseinstructor_user (userId),
    CONSTRAINT fk_courseinstructor_course
        FOREIGN KEY (courseId) REFERENCES Course (id) ON DELETE CASCADE,
    CONSTRAINT fk_courseinstructor_user
        FOREIGN KEY (userId)   REFERENCES `User` (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='มอบหมายผู้สอน — ผู้สอนทุกคนในรายวิชามีสิทธิ์เท่ากัน (D1)';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- END — 5 tables · 6 foreign keys
--
-- Already imported index-q.sql into a Workbench model and want to convert it
-- instead of re-importing? Run this on that model's schema:
--
--   DROP TABLE IF EXISTS EmailVerificationToken;
--   ALTER TABLE `User`
--       DROP COLUMN passwordHash,
--       DROP COLUMN mustChangePassword,
--       DROP COLUMN pwResetAt,
--       DROP COLUMN pwChangedAt;
--
-- Do NOT run the block above against the live PostgreSQL database. Change
-- schema.prisma and create a migration (npm run db:migrate:dev).
-- ============================================================================
