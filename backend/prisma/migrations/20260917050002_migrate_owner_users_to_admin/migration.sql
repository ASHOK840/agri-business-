-- Step 2 of 3 for the three-role rollout.
-- Data migration: every existing OWNER user account becomes ADMIN
-- (ADMIN is the Father/Owner role going forward). No users are deleted.
-- Run as its own migration/transaction because Postgres will not allow
-- an enum value added in the same transaction to be used yet.

UPDATE "users" SET "role" = 'ADMIN' WHERE "role" = 'OWNER';
