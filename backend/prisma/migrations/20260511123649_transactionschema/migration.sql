-- CreateEnum
CREATE TYPE "Transaction_type" AS ENUM ('DEPOSIT', 'WITHDRAWL', 'PROCESS_ORDER');

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transactions" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "Transaction_type" NOT NULL,

    CONSTRAINT "Transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userid_asset_key" ON "Wallet"("userid", "asset");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
