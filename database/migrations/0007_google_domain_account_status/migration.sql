-- ============================================================================
-- 0007 — Google sign-in domain approval (2026-09-23)
--
-- FR-08: a Google sign-in from outside the institution's email domain must
-- not silently become an active INSTRUCTOR account. It is created PENDING;
-- an ADMIN approves it explicitly before it can sign in.
--
-- User.status is deliberately separate from User.isActive: isActive is the
-- admin kill switch (FR-03) and can flip an ACTIVE account off at any time;
-- status only ever moves PENDING -> ACTIVE and never back, so an approval
-- can't be confused with a re-suspension.
--
-- Hand-written per the project convention (0003/0005/0006): additive enum +
-- column + index, so `prisma migrate diff` against database/schema.prisma
-- should reproduce this exactly — verify with a shadow database before
-- applying anywhere shared:
--
--   npx prisma migrate diff \
--     --from-migrations database/migrations \
--     --to-schema-datamodel database/schema.prisma \
--     --shadow-database-url "$SHADOW_DATABASE_URL" \
--     --script
-- ============================================================================

CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE');

ALTER TABLE "User"
    ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX "User_status_idx" ON "User"("status");
