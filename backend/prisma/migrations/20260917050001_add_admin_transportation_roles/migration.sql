-- Step 1 of 3 for the three-role rollout (ADMIN/STAFF/TRANSPORTATION).
-- Additive only: adds the two new enum values (OWNER is untouched and
-- stays valid for now) and the nullable TransportRecord -> User
-- assignment link. No existing data is modified or at risk here.

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'TRANSPORTATION';

-- AlterTable
ALTER TABLE "transport_records" ADD COLUMN "assignedUserId" TEXT;

-- CreateIndex
CREATE INDEX "transport_records_assignedUserId_idx" ON "transport_records"("assignedUserId");

-- AddForeignKey
ALTER TABLE "transport_records" ADD CONSTRAINT "transport_records_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
