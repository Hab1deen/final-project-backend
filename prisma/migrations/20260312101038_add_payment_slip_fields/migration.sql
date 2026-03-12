-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "paymentSlip" TEXT,
ADD COLUMN     "transferredAt" TIMESTAMP(3);
