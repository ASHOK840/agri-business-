-- Step 3 of 3 for the three-role rollout.
-- By this point no "users" row uses OWNER any more (migrated to ADMIN in
-- the previous step), so it's safe to drop it from the enum. Postgres has
-- no direct "DROP VALUE" for enums, so the standard approach is to
-- recreate the type and swap the column over to it.

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'TRANSPORTATION');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::text::"UserRole");
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STAFF';
DROP TYPE "UserRole_old";
