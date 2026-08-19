-- AlterTable
ALTER TABLE "users" ADD COLUMN     "defiPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "defisData" JSONB NOT NULL DEFAULT '{}';
