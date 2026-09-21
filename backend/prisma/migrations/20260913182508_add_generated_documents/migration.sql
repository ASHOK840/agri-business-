-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('FARMER_PURCHASE_RECEIPT', 'FARMER_PAYMENT_RECEIPT', 'BUYER_SALES_INVOICE', 'BUYER_PAYMENT_RECEIPT');

-- CreateTable
CREATE TABLE "generated_documents" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "purchaseId" TEXT,
    "saleId" TEXT,
    "buyerPaymentId" TEXT,
    "generatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "generated_documents_documentNumber_key" ON "generated_documents"("documentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "generated_documents_buyerPaymentId_key" ON "generated_documents"("buyerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "generated_documents_documentType_purchaseId_key" ON "generated_documents"("documentType", "purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "generated_documents_documentType_saleId_key" ON "generated_documents"("documentType", "saleId");

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_buyerPaymentId_fkey" FOREIGN KEY ("buyerPaymentId") REFERENCES "buyer_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
