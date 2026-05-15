/*
  Warnings:

  - You are about to drop the column `market` on the `fills` table. All the data in the column will be lost.
  - Added the required column `asset` to the `fills` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_asset_fkey";

-- DropForeignKey
ALTER TABLE "fills" DROP CONSTRAINT "fills_market_fkey";

-- AlterTable
ALTER TABLE "fills" DROP COLUMN "market",
ADD COLUMN     "asset" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_asset_fkey" FOREIGN KEY ("asset") REFERENCES "Stock"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fills" ADD CONSTRAINT "fills_asset_fkey" FOREIGN KEY ("asset") REFERENCES "Stock"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;
