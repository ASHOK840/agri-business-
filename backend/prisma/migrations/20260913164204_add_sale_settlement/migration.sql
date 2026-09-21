-- CreateTable
CREATE TABLE "sale_settlements" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "dispatchWeightKg" DECIMAL(10,3) NOT NULL,
    "sellingRatePerKg" DECIMAL(10,2) NOT NULL,
    "buyerFinalWeightKg" DECIMAL(10,3) NOT NULL,
    "weightDifferenceKg" DECIMAL(10,3) NOT NULL,
    "differencePercentage" DECIMAL(6,2) NOT NULL,
    "adjustmentAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "adjustmentReason" TEXT,
    "finalSettlementAmount" DECIMAL(12,2) NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "buyerRemarks" TEXT,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sale_settlements_saleId_key" ON "sale_settlements"("saleId");

-- CreateIndex
CREATE INDEX "sale_settlements_saleId_idx" ON "sale_settlements"("saleId");

-- AddForeignKey
ALTER TABLE "sale_settlements" ADD CONSTRAINT "sale_settlements_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_settlements" ADD CONSTRAINT "sale_settlements_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
