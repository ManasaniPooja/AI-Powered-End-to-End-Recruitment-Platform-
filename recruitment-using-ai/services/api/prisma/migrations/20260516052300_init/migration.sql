-- CreateEnum
CREATE TYPE "Role" AS ENUM ('HIRING_MANAGER', 'HR_ADMIN', 'CANDIDATE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AppStatus" AS ENUM ('APPLIED', 'SCREENED', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('PENDING', 'COMPLETED', 'EVALUATED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CANDIDATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "resumeUrl" TEXT NOT NULL,
    "status" "AppStatus" NOT NULL DEFAULT 'APPLIED',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeScore" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "skillsScore" DOUBLE PRECISION NOT NULL,
    "experienceScore" DOUBLE PRECISION NOT NULL,
    "educationScore" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoInterview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "recordingUrl" TEXT,
    "transcript" TEXT,
    "status" "InterviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoInterview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoScore" (
    "id" TEXT NOT NULL,
    "videoInterviewId" TEXT NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "communicationScore" DOUBLE PRECISION NOT NULL,
    "behavioralScore" DOUBLE PRECISION NOT NULL,
    "perQuestionScores" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "inputData" JSONB NOT NULL,
    "outputData" JSONB NOT NULL,
    "reasoning" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiasReport" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "demographicData" JSONB NOT NULL,
    "anomalyFlags" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BiasReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeScore_applicationId_key" ON "ResumeScore"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoInterview_applicationId_key" ON "VideoInterview"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoScore_videoInterviewId_key" ON "VideoScore"("videoInterviewId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeScore" ADD CONSTRAINT "ResumeScore_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoInterview" ADD CONSTRAINT "VideoInterview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoScore" ADD CONSTRAINT "VideoScore_videoInterviewId_fkey" FOREIGN KEY ("videoInterviewId") REFERENCES "VideoInterview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiasReport" ADD CONSTRAINT "BiasReport_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
