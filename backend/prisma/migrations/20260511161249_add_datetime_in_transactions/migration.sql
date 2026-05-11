/*
  Warnings:

  - Added the required column `createdAt` to the `Transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transactions" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL;
