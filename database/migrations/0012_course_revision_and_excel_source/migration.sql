-- Two-way sync for the Excel add-in (FR-76).
--
-- Course.revision: goes up by one after every successful write to a course
-- (live-updates.middleware.ts, the same place the web app's live update is
-- published). The add-in polls it every 10 seconds and reloads only when it
-- moved, because VBA cannot hold the web app's event stream.
--
-- ScoreChangeSource 'EXCEL': a score typed in Excel and synced by the add-in.
-- The server sets it from the token, never from a request body, so the score
-- history says truthfully where a change came from.

-- AlterEnum
ALTER TYPE "ScoreChangeSource" ADD VALUE 'EXCEL';

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Course"
    ADD CONSTRAINT chk_course_revision_non_negative CHECK ("revision" >= 0);
