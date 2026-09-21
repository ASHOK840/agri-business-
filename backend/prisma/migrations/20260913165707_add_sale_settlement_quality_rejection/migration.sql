-- CreateEnum
CREATE TYPE "SaleSettlementStatus" AS ENUM ('ACCEPTED', 'PRICE_ADJUSTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RejectionAction" AS ENUM ('RETURN_TO_WAREHOUSE', 'RESELL', 'DISPOSED_OTHER');

-- AlterTable
ALTER TABLE "sale_settlements" ADD COLUMN     "adjustedSellingRatePerKg" DECIMAL(10,2),
ADD COLUMN     "priceAdjustmentReason" TEXT,
ADD COLUMN     "quantityAffectedKg" DECIMAL(10,3),
ADD COLUMN     "rejectionAction" "RejectionAction",
ADD COLUMN     "rejectionActionNotes" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "settlementStatus" "SaleSettlementStatus" NOT NULL DEFAULT 'ACCEPTED';
