-- FR-07: sign in with a one-time link sent by email.
--
-- 0005 made EmailVerificationToken for verifying an account that already
-- existed, so every row needed a userId. A sign-in link is asked for by
-- typing an address: the account is created only when the link is opened
-- (that is what proves the mailbox), so a token now belongs to an email and
-- to a user only when one exists. Hand-written CHECKs: Prisma cannot express them.

ALTER TABLE "EmailVerificationToken" ADD COLUMN "email" TEXT;

UPDATE "EmailVerificationToken" t
   SET "email" = lower(u."email")
  FROM "User" u
 WHERE u."id" = t."userId";

ALTER TABLE "EmailVerificationToken"
    ALTER COLUMN "email" SET NOT NULL,
    ALTER COLUMN "userId" DROP NOT NULL;

CREATE INDEX "EmailVerificationToken_email_createdAt_idx"
    ON "EmailVerificationToken"("email", "createdAt");

ALTER TABLE "EmailVerificationToken"
    -- The service lower-cases before every write and every lookup.
    ADD CONSTRAINT chk_emailtoken_email_normalised
        CHECK ("email" = lower(btrim("email")) AND length("email") > 0);
