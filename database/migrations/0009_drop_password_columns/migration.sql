-- Hand-written. The system has no passwords: sign-in is Google or an e-mail
-- link (EmailVerificationToken), so nothing reads or writes these columns.
--
-- chk_user_has_credential (0005) required passwordHash OR googleSub. With the
-- password gone that rule would refuse every e-mail-link account (no
-- googleSub), so it is dropped, not rewritten. chk_user_hash (0002) only
-- checked passwordHash and goes with the column.

ALTER TABLE "User"
    DROP CONSTRAINT IF EXISTS chk_user_has_credential,
    DROP CONSTRAINT IF EXISTS chk_user_hash;

ALTER TABLE "User"
    DROP COLUMN "passwordHash",
    DROP COLUMN "mustChangePassword",
    DROP COLUMN "pwResetAt",
    DROP COLUMN "pwChangedAt";
