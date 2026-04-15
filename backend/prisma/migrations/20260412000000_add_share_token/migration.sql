-- AlterTable: add share_token column to interview_kits
ALTER TABLE "interview_kits" ADD COLUMN "share_token" TEXT;

-- CreateIndex: unique constraint on share_token
CREATE UNIQUE INDEX "interview_kits_share_token_key" ON "interview_kits"("share_token");
