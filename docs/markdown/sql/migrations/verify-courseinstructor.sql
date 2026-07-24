-- ============================================================================
-- VERIFY — CourseInstructor behaves as designed
--
-- Run against the database, NOT the Workbench model. Workbench can silently
-- drop the GENERATED expression on leadKey during reverse engineering, which
-- removes the "one LEAD per course" rule without producing any error.
--
--   mysql -u root -p cmas_test < verify-courseinstructor.sql
--
-- Every test prints PASS or FAIL. Read all six before trusting the schema.
-- This script cleans up after itself and leaves no rows behind.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TEST 1 — leadKey must be a STORED GENERATED column, not a plain one.
-- Expect: EXTRA = 'STORED GENERATED' and a non-empty GENERATION_EXPRESSION.
-- ----------------------------------------------------------------------------
SELECT
    'TEST 1: leadKey is generated' AS test,
    CASE WHEN EXTRA LIKE '%GENERATED%' THEN 'PASS' ELSE 'FAIL' END AS result,
    EXTRA, GENERATION_EXPRESSION
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME   = 'CourseInstructor'
  AND COLUMN_NAME  = 'leadKey';

-- ----------------------------------------------------------------------------
-- TEST 2 — both unique keys and both foreign keys must exist.
-- Expect: 4 rows.
-- ----------------------------------------------------------------------------
SELECT
    'TEST 2: keys present' AS test,
    CASE WHEN COUNT(*) = 4 THEN 'PASS' ELSE 'FAIL' END AS result,
    COUNT(*) AS found,
    GROUP_CONCAT(CONSTRAINT_NAME ORDER BY CONSTRAINT_NAME) AS names
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME   = 'CourseInstructor'
  AND CONSTRAINT_NAME IN (
        'uq_courseinstructor_pair', 'uq_courseinstructor_lead',
        'fk_courseinstructor_course', 'fk_courseinstructor_user');

-- ----------------------------------------------------------------------------
-- Fixtures. Two teachers, one course.
-- ----------------------------------------------------------------------------
INSERT INTO `User` (id, email, name, passwordHash, role) VALUES
    ('vt_user_a', 'verify.a@test.local', 'Teacher A',
     '$2b$10$verifyonlyplaceholderhash', 'INSTRUCTOR'),
    ('vt_user_b', 'verify.b@test.local', 'Teacher B',
     '$2b$10$verifyonlyplaceholderhash', 'INSTRUCTOR');

INSERT INTO Course (id, code, name, semester, year, section) VALUES
    ('vt_course_1', 'VERIFY101', 'Verification Course', 1, 2567, '01');

-- ----------------------------------------------------------------------------
-- TEST 3 — the core requirement: MANY instructors on ONE course.
-- One LEAD plus one CO must both be accepted.
-- ----------------------------------------------------------------------------
INSERT INTO CourseInstructor (id, courseId, userId, role) VALUES
    ('vt_ci_1', 'vt_course_1', 'vt_user_a', 'LEAD'),
    ('vt_ci_2', 'vt_course_1', 'vt_user_b', 'CO');

SELECT
    'TEST 3: co-teaching allowed' AS test,
    CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS result,
    COUNT(*) AS instructors
FROM CourseInstructor WHERE courseId = 'vt_course_1';

-- ----------------------------------------------------------------------------
-- TEST 4 — leadKey is populated only on the LEAD row.
-- Expect: LEAD -> 'vt_course_1', CO -> NULL.
-- ----------------------------------------------------------------------------
SELECT
    'TEST 4: leadKey logic' AS test,
    CASE WHEN SUM(leadKey IS NOT NULL) = 1 AND SUM(leadKey IS NULL) = 1
         THEN 'PASS' ELSE 'FAIL' END AS result,
    GROUP_CONCAT(CONCAT(role, '=', IFNULL(leadKey, 'NULL')) ORDER BY role) AS detail
FROM CourseInstructor WHERE courseId = 'vt_course_1';

-- ----------------------------------------------------------------------------
-- TEST 5 — a SECOND lead on the same course must be REJECTED.
-- This is the test Workbench cannot tell you about. If leadKey lost its
-- expression, this INSERT succeeds and the rule is gone.
-- Expect: ERROR 1062 Duplicate entry ... for key 'uq_courseinstructor_lead'
-- ----------------------------------------------------------------------------
SELECT 'TEST 5: second LEAD must FAIL below (expect ERROR 1062)' AS test;

INSERT INTO CourseInstructor (id, courseId, userId, role)
VALUES ('vt_ci_3', 'vt_course_1', 'vt_user_b', 'LEAD');

-- If execution reached here without an error, the constraint is NOT working.
SELECT 'TEST 5: FAIL — duplicate LEAD was accepted' AS result;

-- ----------------------------------------------------------------------------
-- TEST 6 — the audit view reports a healthy course.
-- Expect: status = 'OK', instructorCount = 2, leadCount = 1.
-- ----------------------------------------------------------------------------
SELECT
    'TEST 6: teaching-team view' AS test,
    CASE WHEN status = 'OK' AND instructorCount = 2 AND leadCount = 1
         THEN 'PASS' ELSE 'FAIL' END AS result,
    instructorCount, leadCount, leadName, teachingTeam, status
FROM v_course_teaching_team WHERE courseId = 'vt_course_1';

-- ----------------------------------------------------------------------------
-- CLEANUP. CourseInstructor rows go via ON DELETE CASCADE from Course.
-- Users are deleted last because fk_courseinstructor_user is RESTRICT.
-- ----------------------------------------------------------------------------
DELETE FROM Course     WHERE id = 'vt_course_1';
DELETE FROM `User`     WHERE id IN ('vt_user_a', 'vt_user_b');

SELECT 'CLEANUP DONE — no test rows remain' AS status;
