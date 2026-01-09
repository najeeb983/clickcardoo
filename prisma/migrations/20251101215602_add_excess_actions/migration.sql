-- CreateTable
CREATE TABLE "ExcessAction" (
    "id" TEXT NOT NULL,
    "excess_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExcessAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExcessAction_excess_id_created_at_idx" ON "ExcessAction"("excess_id", "created_at");

-- CreateIndex
CREATE INDEX "ExcessAction_account_id_idx" ON "ExcessAction"("account_id");

-- AddForeignKey
ALTER TABLE "ExcessAction" ADD CONSTRAINT "ExcessAction_excess_id_fkey" FOREIGN KEY ("excess_id") REFERENCES "Excess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcessAction" ADD CONSTRAINT "ExcessAction_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
