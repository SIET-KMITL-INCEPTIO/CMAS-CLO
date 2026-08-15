-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'INSTRUCTOR');

-- CreateEnum
CREATE TYPE "CourseRole" AS ENUM ('LEAD', 'CO', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "GradingType" AS ENUM ('LETTER', 'PASS_FAIL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'INSTRUCTOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "semester" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "section" TEXT NOT NULL DEFAULT '01',
    "credits" DECIMAL(3,1) NOT NULL DEFAULT 3,
    "lectureHours" DECIMAL(4,1) NOT NULL DEFAULT 0,
    "practiceHours" DECIMAL(4,1) NOT NULL DEFAULT 0,
    "selfStudyHours" DECIMAL(4,1) NOT NULL DEFAULT 0,
    "gradingType" "GradingType" NOT NULL DEFAULT 'LETTER',
    "passCriteria" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "classTarget" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseInstructor" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CourseRole" NOT NULL DEFAULT 'CO',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseInstructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CLO" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL DEFAULT 60,

    CONSTRAINT "CLO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralObjective" (
    "id" TEXT NOT NULL,
    "cloId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "BehavioralObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentCriteria" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "cloId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AssessmentCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectiveAssessment" (
    "id" TEXT NOT NULL,
    "criteriaId" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,

    CONSTRAINT "ObjectiveAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "studentCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreUploadLog" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "recordsOk" INTEGER NOT NULL,
    "recordsFail" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreUploadLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE INDEX "Course_year_semester_idx" ON "Course"("year", "semester");

-- CreateIndex
CREATE INDEX "Course_code_idx" ON "Course"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_semester_year_section_key" ON "Course"("code", "semester", "year", "section");

-- CreateIndex
CREATE INDEX "CourseInstructor_userId_idx" ON "CourseInstructor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseInstructor_courseId_userId_key" ON "CourseInstructor"("courseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CLO_courseId_number_key" ON "CLO"("courseId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "BehavioralObjective_cloId_number_key" ON "BehavioralObjective"("cloId", "number");

-- CreateIndex
CREATE INDEX "Activity_courseId_order_idx" ON "Activity"("courseId", "order");

-- CreateIndex
CREATE INDEX "AssessmentCriteria_cloId_idx" ON "AssessmentCriteria"("cloId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentCriteria_activityId_cloId_key" ON "AssessmentCriteria"("activityId", "cloId");

-- CreateIndex
CREATE INDEX "ObjectiveAssessment_objectiveId_idx" ON "ObjectiveAssessment"("objectiveId");

-- CreateIndex
CREATE UNIQUE INDEX "ObjectiveAssessment_criteriaId_objectiveId_key" ON "ObjectiveAssessment"("criteriaId", "objectiveId");

-- CreateIndex
CREATE INDEX "Student_studentCode_idx" ON "Student"("studentCode");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentCode_courseId_key" ON "Student"("studentCode", "courseId");

-- CreateIndex
CREATE INDEX "Score_activityId_idx" ON "Score"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "Score_studentId_activityId_key" ON "Score"("studentId", "activityId");

-- CreateIndex
CREATE INDEX "ScoreUploadLog_courseId_idx" ON "ScoreUploadLog"("courseId");

-- CreateIndex
CREATE INDEX "ScoreUploadLog_createdAt_idx" ON "ScoreUploadLog"("createdAt");

-- AddForeignKey
ALTER TABLE "CourseInstructor" ADD CONSTRAINT "CourseInstructor_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseInstructor" ADD CONSTRAINT "CourseInstructor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CLO" ADD CONSTRAINT "CLO_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralObjective" ADD CONSTRAINT "BehavioralObjective_cloId_fkey" FOREIGN KEY ("cloId") REFERENCES "CLO"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCriteria" ADD CONSTRAINT "AssessmentCriteria_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCriteria" ADD CONSTRAINT "AssessmentCriteria_cloId_fkey" FOREIGN KEY ("cloId") REFERENCES "CLO"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveAssessment" ADD CONSTRAINT "ObjectiveAssessment_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "AssessmentCriteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveAssessment" ADD CONSTRAINT "ObjectiveAssessment_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "BehavioralObjective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreUploadLog" ADD CONSTRAINT "ScoreUploadLog_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreUploadLog" ADD CONSTRAINT "ScoreUploadLog_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

