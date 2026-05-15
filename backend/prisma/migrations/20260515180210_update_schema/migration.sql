/*
  Warnings:

  - You are about to drop the column `market` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[symbol]` on the table `Stock` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `asset` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_market_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "market",
ADD COLUMN     "asset" TEXT NOT NULL,
ALTER COLUMN "price" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Stock_symbol_key" ON "Stock"("symbol");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_asset_fkey" FOREIGN KEY ("asset") REFERENCES "Stock"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_asset_fkey" FOREIGN KEY ("asset") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
