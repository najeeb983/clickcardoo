-- AlterTable
ALTER TABLE "Finance" ADD COLUMN     "bank_card_id" TEXT;

-- CreateIndex
CREATE INDEX "Finance_bank_card_id_idx" ON "Finance"("bank_card_id");

-- AddForeignKey
ALTER TABLE "Finance" ADD CONSTRAINT "Finance_bank_card_id_fkey" FOREIGN KEY ("bank_card_id") REFERENCES "BankCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
