-- ============================================================================
-- MIGRATION 001 — Course instructors: 1:M  ->  M:N
--
-- Applies to a database that ALREADY HAS DATA. For a fresh install just run
-- docs/markdown/sql/mysql/cmas_app_production_v3.sql instead; it already contains
-- the final shape.
--
-- WHAT THIS DOES
--   1. Adds Course.section          — takes over the section-discriminator job
--                                     that Course.instructorId was secretly
--                                     doing inside uq_course_offering.
--   2. Creates CourseInstructor     — the M:N junction, with a role column.
--   3. Copies every existing        — each current instructor becomes the
--      Course.instructorId into it    LEAD of their course.
--   4. Swaps the unique key         — (code, semester, year, section).
--   5. Drops Course.instructorId.
--
-- ORDER MATTERS. Do not reorder: step 3 reads the column that step 5 destroys,
-- and step 4 depends on the section values fixed in step 0.
--
-- !! BACK UP FIRST !!
--   MySQL : mysqldump -u root -p cmas > backup_before_001.sql
--           DDL in MySQL causes an implicit COMMIT — you CANNOT roll this back.
--   Postgres: DDL is transactional, so the whole thing runs inside BEGIN/COMMIT
--           and aborts cleanly on error. A dump is still cheap insurance.
--
-- Pick ONE section below. They are the same migration in two dialects.
-- ============================================================================


-- ############################################################################
-- ###  SECTION A — MySQL 8.0.16+                                            ###
-- ###  (matches docs/markdown/sql/mysql/cmas_app_production_v3.sql)            ###
-- ############################################################################

-- ---------------------------------------------------------------------------
-- STEP 0 — PRE-FLIGHT. Run this ALONE and read the result before continuing.
--
-- Today, two rows can share (code, semester, year) as long as the instructor
-- differs. After step 4 that combination must be unique per SECTION. Every row
-- returned here will collide on the default section '01' and abort step 4.
-- ---------------------------------------------------------------------------
SELECT code, semester, year, COUNT(*) AS collisions,
       GROUP_CONCAT(id SEPARATOR ', ') AS courseIds
FROM Course
GROUP BY code, semester, year
HAVING COUNT(*) > 1;

-- If the query above returned rows, assign distinct sections BEFORE step 4,
-- e.g.:   UPDATE Course SET section = '02' WHERE id = 'clx...';
-- If it returned nothing, continue straight on.


-- STEP 1 — add the section column ------------------------------------------
ALTER TABLE Course
    ADD COLUMN section VARCHAR(10) NOT NULL DEFAULT '01' AFTER year;

ALTER TABLE Course
    ADD CONSTRAINT chk_course_section CHECK (CHAR_LENGTH(TRIM(section)) > 0);


-- STEP 2 — create the junction table ---------------------------------------
CREATE TABLE CourseInstructor (
    id         VARCHAR(30) NOT NULL,
    courseId   VARCHAR(30) NOT NULL,
    userId     VARCHAR(30) NOT NULL,
    role       ENUM('LEAD','CO','ASSISTANT') NOT NULL DEFAULT 'CO',
    assignedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    -- courseId on LEAD rows, NULL otherwise. UNIQUE ignores NULLs, so this
    -- enforces "at most one LEAD per course" without a partial index
    -- (MySQL has none).
    leadKey VARCHAR(30) GENERATED ALWAYS AS
        (CASE WHEN role = 'LEAD' THEN courseId END) STORED,

    PRIMARY KEY (id),
    UNIQUE KEY uq_courseinstructor_pair (courseId, userId),
    UNIQUE KEY uq_courseinstructor_lead (leadKey),
    KEY idx_courseinstructor_user (userId),

    CONSTRAINT fk_courseinstructor_course
        FOREIGN KEY (courseId) REFERENCES Course (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_courseinstructor_user
        FOREIGN KEY (userId) REFERENCES `User` (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- STEP 3 — carry the existing data across ----------------------------------
-- UUID() is 36 chars and will not fit VARCHAR(30); strip the dashes and cut to
-- 25. The leading segments are time-based, so they stay unique per call.
INSERT INTO CourseInstructor (id, courseId, userId, role)
SELECT LEFT(REPLACE(UUID(), '-', ''), 25), id, instructorId, 'LEAD'
FROM Course;

-- Must equal the number of Course rows. If it does not, STOP.
SELECT (SELECT COUNT(*) FROM Course)           AS courses,
       (SELECT COUNT(*) FROM CourseInstructor) AS assignments;


-- STEP 4 — swap the unique key ---------------------------------------------
ALTER TABLE Course DROP INDEX uq_course_offering;
ALTER TABLE Course DROP INDEX idx_course_instructor;
ALTER TABLE Course ADD UNIQUE KEY uq_course_offering (code, semester, year, section);


-- STEP 5 — retire the old column (FK first, always) ------------------------
ALTER TABLE Course DROP FOREIGN KEY fk_course_instructor;
ALTER TABLE Course DROP COLUMN instructorId;


-- STEP 6 — teaching-team view ----------------------------------------------
CREATE OR REPLACE VIEW v_course_teaching_team AS
SELECT
    c.id       AS courseId,
    c.code     AS courseCode,
    c.name     AS courseName,
    c.section,
    c.semester,
    c.year,
    COUNT(ci.id)                                    AS instructorCount,
    SUM(ci.role = 'LEAD')                           AS leadCount,
    MAX(CASE WHEN ci.role = 'LEAD' THEN u.name END) AS leadName,
    GROUP_CONCAT(
        CONCAT(u.name, ' (', ci.role, ')')
        ORDER BY ci.role, u.name SEPARATOR ', '
    )                                               AS teachingTeam,
    CASE
        WHEN COUNT(ci.id) = 0          THEN 'NO_INSTRUCTOR'
        WHEN SUM(ci.role = 'LEAD') = 0 THEN 'NO_LEAD'
        ELSE 'OK'
    END                                             AS status
FROM Course c
LEFT JOIN CourseInstructor ci ON ci.courseId = c.id
LEFT JOIN `User`           u  ON u.id        = ci.userId
GROUP BY c.id, c.code, c.name, c.section, c.semester, c.year;


-- STEP 7 — verify. Expect zero rows. ---------------------------------------
SELECT * FROM v_course_teaching_team WHERE status <> 'OK';


-- ############################################################################
-- ###  SECTION B — PostgreSQL 13+                                           ###
-- ###  (this is what schema.prisma actually targets)                        ###
-- ############################################################################
--
-- Prisma auto-names its indexes and constraints. Confirm the real names first:
--     \d "Course"
-- and substitute below if they differ from the defaults used here.
--
-- Postgres DDL is transactional: if any statement fails, the whole migration
-- rolls back and the database is untouched.

/*
-- STEP 0 — PRE-FLIGHT (run alone, outside the transaction)
SELECT "code", "semester", "year", COUNT(*) AS collisions,
       string_agg("id", ', ') AS course_ids
FROM "Course"
GROUP BY "code", "semester", "year"
HAVING COUNT(*) > 1;


BEGIN;

-- STEP 1
ALTER TABLE "Course" ADD COLUMN "section" TEXT NOT NULL DEFAULT '01';
ALTER TABLE "Course" ADD CONSTRAINT "chk_course_section"
    CHECK (length(btrim("section")) > 0);

-- STEP 2
CREATE TYPE "CourseRole" AS ENUM ('LEAD', 'CO', 'ASSISTANT');

CREATE TABLE "CourseInstructor" (
    "id"         TEXT         NOT NULL,
    "courseId"   TEXT         NOT NULL,
    "userId"     TEXT         NOT NULL,
    "role"       "CourseRole" NOT NULL DEFAULT 'CO',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourseInstructor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseInstructor_courseId_userId_key"
    ON "CourseInstructor" ("courseId", "userId");
CREATE INDEX "CourseInstructor_userId_idx"
    ON "CourseInstructor" ("userId");

-- Postgres has real partial indexes, so no generated-column trick needed.
CREATE UNIQUE INDEX "uq_courseinstructor_lead"
    ON "CourseInstructor" ("courseId") WHERE "role" = 'LEAD';

ALTER TABLE "CourseInstructor"
    ADD CONSTRAINT "CourseInstructor_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseInstructor"
    ADD CONSTRAINT "CourseInstructor_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- STEP 3
INSERT INTO "CourseInstructor" ("id", "courseId", "userId", "role")
SELECT gen_random_uuid()::text, "id", "instructorId", 'LEAD'
FROM "Course";

-- STEP 4
DROP INDEX IF EXISTS "Course_code_semester_year_instructorId_key";
CREATE UNIQUE INDEX "Course_code_semester_year_section_key"
    ON "Course" ("code", "semester", "year", "section");

-- STEP 5
ALTER TABLE "Course" DROP CONSTRAINT "Course_instructorId_fkey";
ALTER TABLE "Course" DROP COLUMN "instructorId";

COMMIT;
*/

-- ============================================================================
-- AFTER THE MIGRATION
--
-- 1. Application queries that filtered on Course.instructorId must now go
--    through CourseInstructor:
--        -- before
--        WHERE "instructorId" = :userId
--        -- after
--        WHERE EXISTS (SELECT 1 FROM "CourseInstructor" ci
--                       WHERE ci."courseId" = "Course"."id"
--                         AND ci."userId"   = :userId)
--
-- 2. course.instructor.name is now a list. Decide per screen whether to show
--    the LEAD only or the whole team.
--
-- 3. Ownership checks ("may this user edit this course?") must test for a row
--    in CourseInstructor rather than comparing a single id.
--
-- 4. Run `prisma db pull` then `prisma generate` so the client matches. Do NOT
--    run `prisma migrate dev` against a database you migrated by hand — it
--    will try to recreate what is already there.
--
-- 5. None of the five existing views referenced instructorId, so they are all
--    unaffected.
-- ============================================================================
