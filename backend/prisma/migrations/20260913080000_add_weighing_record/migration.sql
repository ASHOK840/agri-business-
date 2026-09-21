-- CreateTable
CREATE TABLE "weighing_records" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "numberOfBags" INTEGER NOT NULL,
    "standardBagWeightKg" DECIMAL(6,3) NOT NULL,
    "expectedWeightKg" DECIMAL(10,3) NOT NULL,
    "actualWeightKg" DECIMAL(10,3) NOT NULL,
    "weightDifferenceKg" DECIMAL(10,3) NOT NULL,
    "weighingDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weighing_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weighing_records_purchaseId_weighingDate_idx" ON "weighing_records"("purchaseId", "weighingDate");

-- AddForeignKey
ALTER TABLE "weighing_records" ADD CONSTRAINT "weighing_records_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weighing_records" ADD CONSTRAINT "weighing_records_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
