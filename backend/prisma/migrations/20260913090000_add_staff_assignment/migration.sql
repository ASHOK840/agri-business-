-- CreateEnum
CREATE TYPE "StaffAssignmentStatus" AS ENUM ('ASSIGNED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "staff_assignments" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL,
    "bagsHandled" INTEGER,
    "labourRatePerBag" DECIMAL(8,2) NOT NULL,
    "totalLabourAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "StaffAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_assignments_purchaseId_idx" ON "staff_assignments"("purchaseId");

-- CreateIndex
CREATE INDEX "staff_assignments_staffId_idx" ON "staff_assignments"("staffId");

-- CreateIndex
CREATE INDEX "staff_assignments_status_idx" ON "staff_assignments"("status");

-- AddForeignKey
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
