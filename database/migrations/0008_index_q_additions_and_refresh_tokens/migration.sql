-- ============================================================================
-- 0008 — what index-q.html adds on top of 0007, plus revocable refresh tokens
--        (2026-10-22)
--
-- D-4 (api-design-plan.md §1): accept the tables and columns the prototype
-- stores, as drawn in docs/reference/db/mysql/index-q.sql [index-q]:
--   tables  CourseGroupWeight · UploadReject · RemediationPlan · ScoreChange · AuthEvent
--   columns User +3 · Course.weightMode · Activity typeLabel / assessmentLabel /
--           passScore / closedAt · ScoreUploadLog.kind · Student status /
--           withdrawnAt · Score status / excuseReason, and Score.score NULLable
--   enums   ActivityType and AssessmentMethod gain OTHER and CUSTOM
-- D-2 (S-2): RefreshToken — only the SHA-256 is stored, rotated on every use.
--
-- Sections 1-2 are what `prisma migrate diff` produced from the live 0007
-- database to database/schema.prisma. Section 3 is hand-written: CHECKs
-- Prisma cannot express. Like 0002, they are lost to `prisma db push` — use
-- `migrate`, never `db push`.
--
-- Every change is additive: no column is dropped or renamed, every new
-- NOT NULL column has a default, so existing rows stay valid.
-- ============================================================================

-- SECTION 1-2 — generated
-- CreateEnum
CREATE TYPE "WeightMode" AS ENUM ('MANUAL', 'GROUP');

-- CreateEnum
CREATE TYPE "UploadKind" AS ENUM ('SCORE', 'ROSTER');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ScoreStatus" AS ENUM ('SCORED', 'EXCUSED');

-- CreateEnum
CREATE TYPE "ScoreChangeSource" AS ENUM ('MANUAL', 'IMPORT', 'FILL', 'FILL_UNDO', 'CLOSE', 'PASTE', 'NOTE', 'UNDO');

-- CreateEnum
CREATE TYPE "AuthEventAction" AS ENUM ('CREATE', 'EDIT', 'ROLE_SET', 'SUSPEND', 'ACTIVATE', 'PW_RESET', 'PW_CHANGE', 'DENY', 'REGISTER', 'VERIFY', 'LOGIN', 'LOGIN_GOOGLE', 'LOGOUT');

-- AlterEnum


ALTER TYPE "ActivityType" ADD VALUE 'OTHER';
ALTER TYPE "ActivityType" ADD VALUE 'CUSTOM';

-- AlterEnum


ALTER TYPE "AssessmentMethod" ADD VALUE 'OTHER';
ALTER TYPE "AssessmentMethod" ADD VALUE 'CUSTOM';

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "assessmentLabel" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "closedAt" DATE,
ADD COLUMN     "passScore" DOUBLE PRECISION,
ADD COLUMN     "typeLabel" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "weightMode" "WeightMode" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "Score" ADD COLUMN     "excuseReason" TEXT,
ADD COLUMN     "status" "ScoreStatus" NOT NULL DEFAULT 'SCORED',
ALTER COLUMN "score" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ScoreUploadLog" ADD COLUMN     "kind" "UploadKind" NOT NULL DEFAULT 'SCORE';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
ADD COLUMN     "withdrawnAt" DATE;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pwChangedAt" TIMESTAMP(3),
ADD COLUMN     "pwResetAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CourseGroupWeight" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CourseGroupWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadReject" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "studentCode" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "UploadReject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemediationPlan" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "cloId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RemediationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreChange" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "fromScore" DOUBLE PRECISION,
    "fromExcused" BOOLEAN NOT NULL DEFAULT false,
    "toScore" DOUBLE PRECISION,
    "toExcused" BOOLEAN NOT NULL DEFAULT false,
    "source" "ScoreChangeSource" NOT NULL,
    "note" TEXT,
    "changedBy" TEXT NOT NULL,
    "logId" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "AuthEventAction" NOT NULL,
    "detail" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseGroupWeight_courseId_type_key" ON "CourseGroupWeight"("courseId", "type");

-- CreateIndex
CREATE INDEX "UploadReject_logId_idx" ON "UploadReject"("logId");

-- CreateIndex
CREATE INDEX "RemediationPlan_cloId_idx" ON "RemediationPlan"("cloId");

-- CreateIndex
CREATE UNIQUE INDEX "RemediationPlan_studentId_cloId_key" ON "RemediationPlan"("studentId", "cloId");

-- CreateIndex
CREATE INDEX "ScoreChange_studentId_activityId_changedAt_idx" ON "ScoreChange"("studentId", "activityId", "changedAt");

-- CreateIndex
CREATE INDEX "ScoreChange_activityId_idx" ON "ScoreChange"("activityId");

-- CreateIndex
CREATE INDEX "AuthEvent_userId_at_idx" ON "AuthEvent"("userId", "at");

-- CreateIndex
CREATE INDEX "AuthEvent_actorId_idx" ON "AuthEvent"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");

-- AddForeignKey
ALTER TABLE "CourseGroupWeight" ADD CONSTRAINT "CourseGroupWeight_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadReject" ADD CONSTRAINT "UploadReject_logId_fkey" FOREIGN KEY ("logId") REFERENCES "ScoreUploadLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationPlan" ADD CONSTRAINT "RemediationPlan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationPlan" ADD CONSTRAINT "RemediationPlan_cloId_fkey" FOREIGN KEY ("cloId") REFERENCES "CLO"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationPlan" ADD CONSTRAINT "RemediationPlan_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreChange" ADD CONSTRAINT "ScoreChange_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreChange" ADD CONSTRAINT "ScoreChange_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreChange" ADD CONSTRAINT "ScoreChange_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreChange" ADD CONSTRAINT "ScoreChange_logId_fkey" FOREIGN KEY ("logId") REFERENCES "ScoreUploadLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthEvent" ADD CONSTRAINT "AuthEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthEvent" ADD CONSTRAINT "AuthEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- SECTION 3 — CHECK constraints (hand-written)
--
-- The new enum VALUES (ActivityType/AssessmentMethod OTHER, CUSTOM) are
-- compared as text: Postgres refuses to use a value added by ALTER TYPE ... ADD
-- VALUE in the same transaction it was added in.
-- ============================================================================

-- R3: a score is a number, or NULL because the student is excused — never a
-- NULL that means "not assessed" (that is the absence of the row).
ALTER TABLE "Score"
    ADD CONSTRAINT chk_score_status_value
        CHECK (("status" = 'SCORED') = ("score" IS NOT NULL)),
    ADD CONSTRAINT chk_score_excuse_reason
        CHECK ("excuseReason" IS NULL OR ("status" = 'EXCUSED' AND length(btrim("excuseReason")) > 0));

-- M3: the pass score is a score on this activity.
ALTER TABLE "Activity"
    ADD CONSTRAINT chk_activity_passscore
        CHECK ("passScore" IS NULL OR ("passScore" >= 0 AND "passScore" <= "maxScore")),
    ADD CONSTRAINT chk_activity_type_label
        CHECK ("type"::text <> 'CUSTOM' OR length(btrim("typeLabel")) > 0),
    ADD CONSTRAINT chk_activity_assessment_label
        CHECK ("assessmentMethod"::text <> 'CUSTOM' OR length(btrim("assessmentLabel")) > 0);

-- R2: a withdrawal has a date, an enrolment has none.
ALTER TABLE "Student"
    ADD CONSTRAINT chk_student_withdrawn_at
        CHECK (("status" = 'ENROLLED') = ("withdrawnAt" IS NULL));

ALTER TABLE "CourseGroupWeight"
    ADD CONSTRAINT chk_groupweight_weight CHECK (weight >= 0 AND weight <= 100),
    ADD CONSTRAINT chk_groupweight_type   CHECK (length(btrim("type")) > 0);

ALTER TABLE "RemediationPlan"
    ADD CONSTRAINT chk_remediation_plan
        CHECK (length(btrim("plan")) > 0 AND length("plan") <= 1000);

ALTER TABLE "UploadReject"
    ADD CONSTRAINT chk_uploadreject_row CHECK ("row" > 0);

-- An excused side carries no score.
ALTER TABLE "ScoreChange"
    ADD CONSTRAINT chk_scorechange_from CHECK (NOT "fromExcused" OR "fromScore" IS NULL),
    ADD CONSTRAINT chk_scorechange_to   CHECK (NOT "toExcused" OR "toScore" IS NULL);

ALTER TABLE "RefreshToken"
    ADD CONSTRAINT chk_refreshtoken_expiry CHECK ("expiresAt" > "createdAt");
