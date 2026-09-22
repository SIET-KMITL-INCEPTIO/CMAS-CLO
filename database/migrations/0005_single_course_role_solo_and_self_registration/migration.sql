-- ============================================================================
-- 0005 — Mockup review decisions (2026-09-14): D1 · D2 · D4 · D6
--
-- HAND-WRITTEN, like 0003. Before applying to any shared environment, verify it
-- matches what Prisma would generate for the schema changes (sections 1-4):
--
--   npx prisma migrate diff \
--     --from-migrations database/migrations \
--     --to-schema-datamodel database/schema.prisma \
--     --shadow-database-url "$SHADOW_DATABASE_URL" \
--     --script
--
-- Section 5 (CHECK) is outside what Prisma can express and must never be
-- dropped by a generated migration. `prisma db push` stays banned everywhere.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SECTION 1 — D1: one course role
--
-- A course has instructors and nothing else. The partial unique index from 0002
-- read the column being dropped, so it has to go first.
-- ----------------------------------------------------------------------------

DROP INDEX IF EXISTS uq_courseinstructor_lead;

ALTER TABLE "CourseInstructor" DROP COLUMN "role";

DROP TYPE "CourseRole";

-- ----------------------------------------------------------------------------
-- SECTION 2 — D2: the class target defaults to everyone passing
--
-- Only the DEFAULT changes. Existing courses keep the value their instructors
-- chose; rewriting it would silently flip attainment verdicts already reported.
-- ----------------------------------------------------------------------------

ALTER TABLE "Course" ALTER COLUMN "classTarget" SET DEFAULT 100;

-- ----------------------------------------------------------------------------
-- SECTION 3 — D4: SOLO level beside Bloom
--
-- !! Enum value names are provisional (not yet checked against คอบ. p.33).
--    Rename them before this reaches production, while no row depends on them.
-- ----------------------------------------------------------------------------

CREATE TYPE "SoloLevel" AS ENUM ('SURFACE', 'DEEP', 'TRANSFER');

ALTER TABLE "CLO" ADD COLUMN "soloLevel" "SoloLevel";

-- ----------------------------------------------------------------------------
-- SECTION 4 — D6: self-registration, email verification, Google sign-in
-- ----------------------------------------------------------------------------

CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE');

ALTER TABLE "User"
    ALTER COLUMN "passwordHash" DROP NOT NULL,
    ADD COLUMN "authProvider"    "AuthProvider" NOT NULL DEFAULT 'EMAIL',
    ADD COLUMN "googleSub"       TEXT,
    ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");

-- Every account that exists today was created by an ADMIN (FR-05) and has been
-- signing in already, so it is treated as verified. Without this, the first
-- deploy would lock every current user out behind a link nobody was sent.
UPDATE "User" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;

CREATE TABLE "EmailVerificationToken" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");

ALTER TABLE "EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- SECTION 5 — CHECK constraints (hand-written, Prisma cannot express these)
-- ----------------------------------------------------------------------------

ALTER TABLE "User"
    -- An account with neither a password nor a Google identity can never sign
    -- in again, and nothing in the UI could recover it.
    ADD CONSTRAINT chk_user_has_credential
        CHECK ("passwordHash" IS NOT NULL OR "googleSub" IS NOT NULL);

ALTER TABLE "EmailVerificationToken"
    ADD CONSTRAINT chk_emailtoken_expiry_after_issue
        CHECK ("expiresAt" > "createdAt"),
    ADD CONSTRAINT chk_emailtoken_hash_not_blank
        CHECK (length(btrim("tokenHash")) > 0);
