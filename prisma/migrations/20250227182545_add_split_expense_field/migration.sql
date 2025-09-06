/*
  Warnings:

  - You are about to drop the column `isSplit` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "isSplit",
ADD COLUMN     "isSplitExpense" BOOLEAN NOT NULL DEFAULT false;
