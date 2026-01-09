-- CreateTable
CREATE TABLE "BankCard" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "card_number" TEXT NOT NULL,
    "card_holder_name" TEXT NOT NULL,
    "expiry_date" TEXT NOT NULL,
    "cvv" TEXT,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankCard_account_id_idx" ON "BankCard"("account_id");

-- AddForeignKey
ALTER TABLE "BankCard" ADD CONSTRAINT "BankCard_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
