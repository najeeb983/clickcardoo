-- CreateEnum
CREATE TYPE "ExcessStatus" AS ENUM ('NEED_UPDATE', 'APPROVED', 'DECLINED');

-- AlterTable
ALTER TABLE "Excess" ADD COLUMN     "status" "ExcessStatus" NOT NULL DEFAULT 'NEED_UPDATE';
