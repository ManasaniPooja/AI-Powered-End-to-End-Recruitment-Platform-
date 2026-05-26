/*
  Warnings:

  - The values [IN_PROGRESS] on the enum `InterviewStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `candidateEmail` on the `VideoInterview` table. All the data in the column will be lost.
  - You are about to drop the column `candidateName` on the `VideoInterview` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `VideoInterview` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `VideoInterview` table. All the data in the column will be lost.
  - You are about to drop the column `inviteToken` on the `VideoInterview` table. All the data in the column will be lost.
  - You are about to drop the column `invitedAt` on the `VideoInterview` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InterviewStatus_new" AS ENUM ('PENDING', 'COMPLETED', 'EVALUATED');
ALTER TABLE "VideoInterview" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "VideoInterview" ALTER COLUMN "status" TYPE "InterviewStatus_new" USING ("status"::text::"InterviewStatus_new");
ALTER TYPE "InterviewStatus" RENAME TO "InterviewStatus_old";
ALTER TYPE "InterviewStatus_new" RENAME TO "InterviewStatus";
DROP TYPE "InterviewStatus_old";
ALTER TABLE "VideoInterview" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_actorId_fkey";

-- DropIndex
DROP INDEX "VideoInterview_inviteToken_key";

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "actorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "VideoInterview" DROP COLUMN "candidateEmail",
DROP COLUMN "candidateName",
DROP COLUMN "completedAt",
DROP COLUMN "expiresAt",
DROP COLUMN "inviteToken",
DROP COLUMN "invitedAt";

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
