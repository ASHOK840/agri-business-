-- CreateTable
CREATE TABLE "transport_payments" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "transportRecordId" TEXT NOT NULL,
    "transporterId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "transactionReferenceNumber" TEXT,
    "notes" TEXT,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transport_payments_paymentNumber_key" ON "transport_payments"("paymentNumber");

-- CreateIndex
CREATE INDEX "transport_payments_transportRecordId_idx" ON "transport_payments"("transportRecordId");

-- CreateIndex
CREATE INDEX "transport_payments_transporterId_idx" ON "transport_payments"("transporterId");

-- CreateIndex
CREATE INDEX "transport_payments_paymentDate_idx" ON "transport_payments"("paymentDate");

-- AddForeignKey
ALTER TABLE "transport_payments" ADD CONSTRAINT "transport_payments_transportRecordId_fkey" FOREIGN KEY ("transportRecordId") REFERENCES "transport_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_payments" ADD CONSTRAINT "transport_payments_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "transporters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_payments" ADD CONSTRAINT "transport_payments_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
