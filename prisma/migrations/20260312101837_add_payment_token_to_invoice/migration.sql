/*
  Warnings:

  - A unique constraint covering the columns `[paymentToken]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "paymentToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "invoices_paymentToken_key" ON "invoices"("paymentToken");
