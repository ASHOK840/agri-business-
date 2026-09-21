-- CreateTable
CREATE TABLE "staff_payments" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "transactionReferenceNumber" TEXT,
    "notes" TEXT,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_payments_paymentNumber_key" ON "staff_payments"("paymentNumber");

-- CreateIndex
CREATE INDEX "staff_payments_assignmentId_idx" ON "staff_payments"("assignmentId");

-- CreateIndex
CREATE INDEX "staff_payments_staffId_idx" ON "staff_payments"("staffId");

-- CreateIndex
CREATE INDEX "staff_payments_paymentDate_idx" ON "staff_payments"("paymentDate");

-- AddForeignKey
ALTER TABLE "staff_payments" ADD CONSTRAINT "staff_payments_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "staff_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_payments" ADD CONSTRAINT "staff_payments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_payments" ADD CONSTRAINT "staff_payments_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
