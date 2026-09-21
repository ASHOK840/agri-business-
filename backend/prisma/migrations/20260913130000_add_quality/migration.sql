-- CreateTable
CREATE TABLE "quality_statuses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRejection" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_records" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "buyerId" TEXT,
    "qualityStatusId" TEXT NOT NULL,
    "grade" TEXT,
    "remarks" TEXT,
    "moisturePercentage" DECIMAL(5,2),
    "buyerRemarks" TEXT,
    "priceAdjustment" DECIMAL(10,2),
    "rejectionReason" TEXT,
    "assessedBy" TEXT NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quality_statuses_code_key" ON "quality_statuses"("code");

-- CreateIndex
CREATE INDEX "quality_records_purchaseId_idx" ON "quality_records"("purchaseId");

-- CreateIndex
CREATE INDEX "quality_records_buyerId_idx" ON "quality_records"("buyerId");

-- CreateIndex
CREATE INDEX "quality_records_qualityStatusId_idx" ON "quality_records"("qualityStatusId");

-- AddForeignKey
ALTER TABLE "quality_records" ADD CONSTRAINT "quality_records_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_records" ADD CONSTRAINT "quality_records_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_records" ADD CONSTRAINT "quality_records_qualityStatusId_fkey" FOREIGN KEY ("qualityStatusId") REFERENCES "quality_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_records" ADD CONSTRAINT "quality_records_assessedBy_fkey" FOREIGN KEY ("assessedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
