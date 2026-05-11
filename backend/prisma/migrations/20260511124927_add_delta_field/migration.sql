/*
  Warnings:

  - The values [WITHDRAWL] on the enum `Transaction_type` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `delta` to the `Transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Transaction_type_new" AS ENUM ('DEPOSIT', 'WITHDRAW', 'PROCESS_ORDER', 'FEE_DEDUCTION');
ALTER TABLE "Transactions" ALTER COLUMN "type" TYPE "Transaction_type_new" USING ("type"::text::"Transaction_type_new");
ALTER TYPE "Transaction_type" RENAME TO "Transaction_type_old";
ALTER TYPE "Transaction_type_new" RENAME TO "Transaction_type";
DROP TYPE "public"."Transaction_type_old";
COMMIT;

-- AlterTable
ALTER TABLE "Transactions" ADD COLUMN     "delta" INTEGER NOT NULL;
