-- ============================================================================
-- 0006 — Mockup review round 2 (2026-09-17): CLO → objective → activity
--
-- Decisions (docs/markdown/dev/planning/mockup-feedback-plan.md §5):
--   E1  a CLO is passed on Course.cloPassMark (one value per course); the
--       per-CLO threshold is removed (T7)
--   E2  CLO.weight is entered by the instructor and checked against the share
--       the activity mapping implies — a mismatch warns, it does not block
--   E3  CLO.levelSource AUTO/MANUAL for suggested Bloom/SOLO levels (T10)
--   T3  Activity.type + assessmentMethod + passMark + criteriaNote replace
--       the free-text `method`
--   T4  AssessmentCriteria pairs Activity with BehavioralObjective, not CLO;
--       ObjectiveAssessment is merged into it and dropped
--   T6  BehavioralObjective.weight, summing to 100 per CLO
--
-- HAND-WRITTEN, like 0003 and 0005, because the generated DDL would drop
-- AssessmentCriteria.cloId and lose every existing activity→CLO link. Sections
-- 1, 3, 5 and 7 match `prisma migrate diff` from the previous schema (checked
-- 2026-09-17 against a reconstructed datamodel); before applying anywhere
-- shared, re-check against a shadow database:
--
--   npx prisma migrate diff \
--     --from-migrations database/migrations \
--     --to-schema-datamodel database/schema.prisma \
--     --shadow-database-url "$SHADOW_DATABASE_URL" \
--     --script
--
-- NOT YET APPLIED TO ANY DATABASE. Neither is 0005.
-- `prisma db push` stays banned everywhere.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SECTION 1 — new enums
-- ----------------------------------------------------------------------------

CREATE TYPE "LevelSource" AS ENUM ('AUTO', 'MANUAL');

CREATE TYPE "ActivityType" AS ENUM ('LECTURE', 'LAB', 'TEST', 'PROJECT');

CREATE TYPE "AssessmentMethod" AS ENUM ('QUIZ', 'EXAM', 'RUBRIC', 'WORK', 'OBSERVATION');

-- ----------------------------------------------------------------------------
-- SECTION 2 — backfills that must read the OLD columns, before they go
-- ----------------------------------------------------------------------------

-- E1: the course pass mark starts at the average of that course's CLO
-- thresholds. Any single value changes some verdict for a course whose CLOs
-- used different thresholds; the average moves the fewest. Review those courses.
ALTER TABLE "Course" ADD COLUMN "cloPassMark" DOUBLE PRECISION NOT NULL DEFAULT 60;

UPDATE "Course" co
   SET "cloPassMark" = s.avg_threshold
  FROM (SELECT "courseId", ROUND(AVG(threshold)::numeric, 2)::double precision AS avg_threshold
          FROM "CLO" GROUP BY "courseId") s
 WHERE s."courseId" = co.id;

-- E2: a CLO's entered weight starts as exactly the share the mapping implies,
-- so no course opens with a mismatch warning it did not cause.
ALTER TABLE "CLO"
    ADD COLUMN "weight"      DOUBLE PRECISION,
    ADD COLUMN "levelSource" "LevelSource" NOT NULL DEFAULT 'AUTO';

UPDATE "CLO" c
   SET weight = s.share
  FROM (SELECT ac."cloId", SUM(a.weight * ac.weight / 100.0) AS share
          FROM "AssessmentCriteria" ac
          JOIN "Activity" a ON a.id = ac."activityId"
         GROUP BY ac."cloId") s
 WHERE s."cloId" = c.id;

-- E3: every existing level was chosen by a person. Marking them AUTO would let
-- the next text edit silently replace them with a suggestion.
UPDATE "CLO" SET "levelSource" = 'MANUAL';

-- T6: objectives start with an even split inside their CLO (last one takes the
-- remainder so the sum is exactly 100).
ALTER TABLE "BehavioralObjective" ADD COLUMN "weight" DOUBLE PRECISION;

UPDATE "BehavioralObjective" bo
   SET weight = q.w
  FROM (SELECT id,
               CASE WHEN rn = n THEN 100 - FLOOR(100.0 / n) * (n - 1)
                    ELSE FLOOR(100.0 / n) END AS w
          FROM (SELECT id,
                       ROW_NUMBER() OVER (PARTITION BY "cloId" ORDER BY number) AS rn,
                       COUNT(*)     OVER (PARTITION BY "cloId")                 AS n
                  FROM "BehavioralObjective") r) q
 WHERE q.id = bo.id;

-- T3: the old free text is kept as the start of the criteria note.
ALTER TABLE "Activity"
    ADD COLUMN "type"             "ActivityType"     NOT NULL DEFAULT 'TEST',
    ADD COLUMN "assessmentMethod" "AssessmentMethod" NOT NULL DEFAULT 'EXAM',
    ADD COLUMN "criteriaNote"     TEXT               NOT NULL DEFAULT '',
    ADD COLUMN "passMark"         DOUBLE PRECISION   NOT NULL DEFAULT 50;

UPDATE "Activity" SET "criteriaNote" = method WHERE method IS NOT NULL;

-- ----------------------------------------------------------------------------
-- SECTION 3 — T7 / T3: drop the replaced columns
--   chk_clo_threshold (0002) references only `threshold` and is dropped with it.
-- ----------------------------------------------------------------------------

ALTER TABLE "CLO"      DROP COLUMN "threshold";
ALTER TABLE "Activity" DROP COLUMN "method";

-- ----------------------------------------------------------------------------
-- SECTION 4 — T4: re-key AssessmentCriteria from CLO to objective
--
-- Each old (activity, CLO, weight) row becomes one row per objective:
--   · the objectives ObjectiveAssessment already linked to it, if any
--   · otherwise every objective under that CLO
-- and the weight is split evenly between them, so each activity still sums to
-- exactly what it summed to before. A CLO with no objective at all cannot be
-- represented — the migration stops rather than drop the link silently.
-- ----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_objassess_same_clo ON "ObjectiveAssessment";
DROP FUNCTION IF EXISTS trg_objassess_same_clo();
DROP TRIGGER IF EXISTS trg_criteria_same_course ON "AssessmentCriteria";

DO $$
DECLARE
    n INT;
BEGIN
    SELECT COUNT(*) INTO n
      FROM "AssessmentCriteria" ac
     WHERE NOT EXISTS (SELECT 1 FROM "BehavioralObjective" bo WHERE bo."cloId" = ac."cloId");
    IF n > 0 THEN
        RAISE EXCEPTION '0006: % AssessmentCriteria row(s) measure a CLO with no BehavioralObjective. Add an objective to each such CLO, then re-run.', n;
    END IF;
END $$;

CREATE TEMP TABLE _criteria_by_objective AS
WITH candidates AS (
    SELECT ac.id AS criteria_id, ac."activityId", ac.weight, oa."objectiveId"
      FROM "AssessmentCriteria" ac
      JOIN "ObjectiveAssessment" oa ON oa."criteriaId" = ac.id
    UNION ALL
    SELECT ac.id, ac."activityId", ac.weight, bo.id
      FROM "AssessmentCriteria" ac
      JOIN "BehavioralObjective" bo ON bo."cloId" = ac."cloId"
     WHERE NOT EXISTS (SELECT 1 FROM "ObjectiveAssessment" oa WHERE oa."criteriaId" = ac.id)
)
SELECT criteria_id || '_' || "objectiveId"                     AS id,
       "activityId",
       "objectiveId",
       weight / COUNT(*) OVER (PARTITION BY criteria_id)       AS weight
  FROM candidates;

ALTER TABLE "ObjectiveAssessment" DROP CONSTRAINT "ObjectiveAssessment_criteriaId_fkey";
ALTER TABLE "ObjectiveAssessment" DROP CONSTRAINT "ObjectiveAssessment_objectiveId_fkey";
DROP TABLE "ObjectiveAssessment";

DELETE FROM "AssessmentCriteria";

ALTER TABLE "AssessmentCriteria" DROP CONSTRAINT "AssessmentCriteria_cloId_fkey";
DROP INDEX "AssessmentCriteria_cloId_idx";
DROP INDEX "AssessmentCriteria_activityId_cloId_key";

ALTER TABLE "AssessmentCriteria"
    DROP COLUMN "cloId",
    ADD COLUMN "objectiveId" TEXT NOT NULL;

INSERT INTO "AssessmentCriteria" (id, "activityId", "objectiveId", weight)
SELECT id, "activityId", "objectiveId", weight FROM _criteria_by_objective;

DROP TABLE _criteria_by_objective;

-- ----------------------------------------------------------------------------
-- SECTION 5 — indexes and foreign key (as Prisma generates them)
-- ----------------------------------------------------------------------------

CREATE INDEX "AssessmentCriteria_objectiveId_idx" ON "AssessmentCriteria"("objectiveId");

CREATE UNIQUE INDEX "AssessmentCriteria_activityId_objectiveId_key"
    ON "AssessmentCriteria"("activityId", "objectiveId");

ALTER TABLE "AssessmentCriteria"
    ADD CONSTRAINT "AssessmentCriteria_objectiveId_fkey"
    FOREIGN KEY ("objectiveId") REFERENCES "BehavioralObjective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- SECTION 6 — trigger (hand-written, Prisma cannot express this)
--
-- Replaces 0002's DC-04 trigger: the Activity and the objective's CLO must
-- belong to the same course. 0002's DC-06 trigger (objective/criterion same
-- CLO) has nothing left to guard — the criterion no longer names a CLO.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_criteria_same_course() RETURNS trigger AS $$
DECLARE
    v_activity_course  TEXT;
    v_objective_course TEXT;
BEGIN
    SELECT "courseId" INTO v_activity_course FROM "Activity" WHERE id = NEW."activityId";
    SELECT c."courseId" INTO v_objective_course
      FROM "BehavioralObjective" bo JOIN "CLO" c ON c.id = bo."cloId"
     WHERE bo.id = NEW."objectiveId";

    IF v_activity_course IS DISTINCT FROM v_objective_course THEN
        RAISE EXCEPTION 'Activity and behavioral objective belong to different courses';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_criteria_same_course
    BEFORE INSERT OR UPDATE ON "AssessmentCriteria"
    FOR EACH ROW EXECUTE FUNCTION trg_criteria_same_course();

-- ----------------------------------------------------------------------------
-- SECTION 7 — CHECK constraints (hand-written)
-- "sums to 100" is NOT a constraint: an instructor passes through partial sums
-- while typing. The application reports it (readiness steps), as CR-01 does for
-- activity weights.
-- ----------------------------------------------------------------------------

ALTER TABLE "Course"
    ADD CONSTRAINT chk_course_clo_pass_mark
        CHECK ("cloPassMark" >= 0 AND "cloPassMark" <= 100);

ALTER TABLE "CLO"
    ADD CONSTRAINT chk_clo_weight
        CHECK (weight IS NULL OR (weight >= 0 AND weight <= 100));

ALTER TABLE "BehavioralObjective"
    ADD CONSTRAINT chk_behavioral_weight
        CHECK (weight IS NULL OR (weight >= 0 AND weight <= 100));

ALTER TABLE "Activity"
    ADD CONSTRAINT chk_activity_pass_mark
        CHECK ("passMark" >= 0 AND "passMark" <= 100);
