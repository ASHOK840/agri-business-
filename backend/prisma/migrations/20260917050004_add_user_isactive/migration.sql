-- Lets Admin deactivate a Staff/Transportation login (Manage Users) without
-- deleting the account or its historical records. Defaults every existing
-- user to active, so no one is locked out by this change.

ALTER TABLE "users" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
