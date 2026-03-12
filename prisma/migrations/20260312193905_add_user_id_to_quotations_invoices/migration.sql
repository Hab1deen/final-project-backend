/*
  Warnings:

  - You are about to drop the column `paymentToken` on the `invoices` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "invoices_paymentToken_key";

-- Create a temporary function to get the first user ID
CREATE OR REPLACE FUNCTION get_first_user_id()
RETURNS INTEGER AS $$
DECLARE
    first_user_id INTEGER;
BEGIN
    SELECT id INTO first_user_id FROM "users" LIMIT 1;
    RETURN first_user_id;
END;
$$ LANGUAGE plpgsql;

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "paymentToken",
ADD COLUMN     "userId" INTEGER NOT NULL DEFAULT get_first_user_id();

-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "userId" INTEGER NOT NULL DEFAULT get_first_user_id();

-- Remove default values after adding the columns
ALTER TABLE "invoices" ALTER COLUMN "userId" DROP DEFAULT;
ALTER TABLE "quotations" ALTER COLUMN "userId" DROP DEFAULT;

-- Drop the temporary function
DROP FUNCTION get_first_user_id();

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
