-- CreateEnum
CREATE TYPE "CropPriceType" AS ENUM ('MARKET', 'BUYER_QUOTE', 'MANUAL');

-- CreateTable
CREATE TABLE "crop_prices" (
    "id" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "buyerId" TEXT,
    "quality" TEXT,
    "pricePerKg" DECIMAL(10,2) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "sourceType" "CropPriceType" NOT NULL DEFAULT 'MARKET',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crop_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crop_prices_cropId_effectiveDate_idx" ON "crop_prices"("cropId", "effectiveDate");

-- AddForeignKey
ALTER TABLE "crop_prices" ADD CONSTRAINT "crop_prices_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_prices" ADD CONSTRAINT "crop_prices_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_prices" ADD CONSTRAINT "crop_prices_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
