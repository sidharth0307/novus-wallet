/*
  Warnings:

  - A unique constraint covering the columns `[claimToken]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'PENDING_CLAIM';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "claimToken" TEXT,
ADD COLUMN     "recipientEmail" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_claimToken_key" ON "Transaction"("claimToken");
