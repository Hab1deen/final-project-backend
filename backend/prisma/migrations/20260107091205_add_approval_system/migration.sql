/*
  Warnings:

  - A unique constraint covering the columns `[approvalToken]` on the table `quotations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "approvalNotes" TEXT,
ADD COLUMN     "approvalStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "approvalToken" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "quotations_approvalToken_key" ON "quotations"("approvalToken");
