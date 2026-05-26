/*
  Warnings:

  - A unique constraint covering the columns `[inviteToken]` on the table `VideoInterview` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "InterviewStatus" ADD VALUE 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "VideoInterview" ADD COLUMN     "candidateEmail" TEXT,
ADD COLUMN     "candidateName" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "invitedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "VideoInterview_inviteToken_key" ON "VideoInterview"("inviteToken");
