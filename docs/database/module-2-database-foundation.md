# Database Foundation — Module 2

## Entities in this module

Only the six core master-data entities are implemented here. No business
transaction tables (purchases, sales, inventory, payments, etc.) exist yet —
those come in later modules and will reference these tables via foreign keys.

| Entity | Table name | Purpose |
|---|---|---|
| User | `users` | Login accounts for the owner and staff |
| Farmer | `farmers` | Crop suppliers |
| Staff | `staff` | Business employees who handle field operations |
| Crop | `crops` | Rice, Wheat, Maize, Musri, etc. |
| Buyer | `buyers` | Large buyers/companies the business sells to |
| Warehouse | `warehouses` | Storage locations (currently one) |

## Design decisions

**Primary keys are UUIDs (`String @default(uuid())`)**, not auto-increment
integers. This avoids exposing sequential record counts (e.g. total number
of farmers) and makes IDs safe to reference in URLs, receipts, and future
API responses without giving away business volume.

**`status` fields use an enum (`ACTIVE` / `INACTIVE`)**, not a boolean. This
leaves room to add a status like `SUSPENDED` later without a breaking schema
change. Nothing is ever hard-deleted — deactivating a farmer, staff member,
crop, buyer, or warehouse just flips this field. This preserves historical
integrity: a farmer marked inactive still has valid historical purchase
records once the Purchases module is built.

**`defaultBagWeightKg` on Crop is a `Decimal(6,3)` defaulting to `42`**, not
a hard-coded constant anywhere in code. Any part of the application that
needs the "42 kg" figure must read it from this field, per crop. This lets
each crop (and, in a later module, each individual purchase) override the
bag weight without a code change.

**`email` on User and the `*Code` fields (`farmerCode`, `staffCode`,
`cropCode`, `buyerCode`) are unique**, enforced at the database level with
unique indexes — not just validated in application code. This was verified
directly: attempting to insert a duplicate `staffCode` was correctly
rejected by PostgreSQL.

**Every table has `createdAt` (auto-set) and `updatedAt` (auto-updated by
Prisma on every write)**, standard audit fields all later modules will rely
on for reporting and audit logs.

## What is intentionally NOT in this module

- No Purchase, Sale, Weighing, Labour, Transport, Inventory, Payment,
  Settlement, Expense, Receipt, or Invoice tables.
- No relationships (foreign keys) between these six entities and anything
  else yet — they don't need any at this stage.
- No authentication logic (password verification, JWT) — only the `User`
  table structure needed to store credentials. Login itself is Module 3.

## Entity notes

Each entity also has a placeholder file under
`database/docs/entity-notes/<Entity>.md` (from the Module 1 architecture)
for recording field/relationship decisions as later modules add foreign
keys pointing to these tables.
