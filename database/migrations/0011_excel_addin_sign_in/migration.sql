-- Excel add-in sign-in (device code) and its course-scoped token.
--
-- The CMAS add-in for Excel (VBA, Windows and Mac) asks for a short code, the
-- instructor approves it in the web app for ONE course, and the add-in collects
-- a token that can read and write that course's scores only, for 8 hours.
-- Only SHA-256 hashes of the secrets are stored. Hand-written CHECKs at the end:
-- Prisma cannot express them.

-- CreateTable
CREATE TABLE "ExcelDeviceCode" (
    "id" TEXT NOT NULL,
    "deviceCodeHash" TEXT NOT NULL,
    "userCode" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "userId" TEXT,
    "courseId" TEXT,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExcelDeviceCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExcelLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExcelLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExcelDeviceCode_deviceCodeHash_key" ON "ExcelDeviceCode"("deviceCodeHash");

-- CreateIndex
CREATE UNIQUE INDEX "ExcelDeviceCode_userCode_key" ON "ExcelDeviceCode"("userCode");

-- CreateIndex
CREATE INDEX "ExcelDeviceCode_expiresAt_idx" ON "ExcelDeviceCode"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExcelLink_tokenHash_key" ON "ExcelLink"("tokenHash");

-- CreateIndex
CREATE INDEX "ExcelLink_userId_idx" ON "ExcelLink"("userId");

-- AddForeignKey
ALTER TABLE "ExcelDeviceCode" ADD CONSTRAINT "ExcelDeviceCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcelDeviceCode" ADD CONSTRAINT "ExcelDeviceCode_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcelLink" ADD CONSTRAINT "ExcelLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcelLink" ADD CONSTRAINT "ExcelLink_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- An approval names who approved it and for which course, all three or none.
ALTER TABLE "ExcelDeviceCode"
    ADD CONSTRAINT chk_excel_device_approval_complete
        CHECK (("approvedAt" IS NULL AND "userId" IS NULL AND "courseId" IS NULL)
            OR ("approvedAt" IS NOT NULL AND "userId" IS NOT NULL AND "courseId" IS NOT NULL)),
    -- Only an approved code can be collected.
    ADD CONSTRAINT chk_excel_device_consumed_after_approval
        CHECK ("consumedAt" IS NULL OR "approvedAt" IS NOT NULL),
    -- The service writes the code without its dash, from an alphabet with no 0/O/1/I.
    ADD CONSTRAINT chk_excel_device_user_code
        CHECK ("userCode" ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$');

-- 0009 enabled RLS on every table that existed then; these two follow the same
-- rule. The app connects as the owner, which RLS does not restrict.
ALTER TABLE "ExcelDeviceCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExcelLink" ENABLE ROW LEVEL SECURITY;
