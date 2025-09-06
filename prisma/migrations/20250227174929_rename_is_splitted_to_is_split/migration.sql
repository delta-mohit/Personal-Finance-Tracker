/*
  Warnings:

  - You are about to drop the column `isSplitted` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "isSplitted",
ADD COLUMN     "isSplit" BOOLEAN NOT NULL DEFAULT false;
