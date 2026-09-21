# Agri Business Management System

A complete crop procurement and agricultural trading management system,
built for a real family business. It digitizes the full trading workflow:

```
Farmer → Crop Purchase → Staff Assignment → Weighing → Transportation →
Warehouse / Inventory → Buyer → Sale → Truck Dispatch → Buyer Final Weight →
Quality Adjustment / Rejection → Buyer Payment → Farmer Settlement →
Profit & Loss → Reports
```

This README covers running the finished application locally. For taking it
to a live server, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

---

## What's included

**Farmers, Crops & Purchases**
Farmer records, configurable crops (with per-crop bag weight), purchase
creation with a frozen negotiated rate, weighing/bagging reconciliation,
staff assignment for labour tracking, and farmer advance/final payment
settlement.

**Transportation & Warehouse**
Farmer→warehouse and warehouse→buyer transport records (transporter,
driver, vehicle), and a warehouse inventory ledger where stock is always
computed live from purchase/sale/adjustment movements — never a stored,
driftable number.

**Buyers & Sales**
Buyer records, sales with a frozen selling rate, dispatch against live
stock (with an authorized-adjustment override), buyer final-weight
settlement, quality-based price adjustment or rejection handling, and full
buyer payment history (partial payments supported).

**Money**
Business expense tracking by configurable category, and per-sale
profit/loss computed live from actual purchase cost, transport, labour,
and other linked expenses — never a hardcoded margin.

**Documents, Dashboard & Reports**
Digital farmer/buyer receipts and invoices, an owner dashboard with
live stock/outstanding/profit figures and business alerts (pending
payments, rejected shipments, low stock, weight loss, and more), 13
exportable business reports, and an immutable audit log of every
significant change (who did what, when, before/after).

**Security**
Role-based access (OWNER/STAFF) enforced on every route, JWT auth with a
pinned algorithm and no source-controlled secret fallback, rate limiting
on login and the API generally, centralized error handling that never
leaks internals, and server-side recalculation of every financial figure
— the frontend never dictates an amount that gets trusted as-is.

---

## Tech stack

| | |
|---|---|
| **Frontend** | React, Vite, TypeScript, Tailwind CSS, React Router, Axios |
| **Backend** | Node.js, Express, TypeScript, Zod, Prisma, JWT, bcrypt, Helmet, express-rate-limit, Morgan |
| **Database** | PostgreSQL |

## Project structure

```
agri-business/
├── frontend/            React + Vite SPA
│   ├── src/
│   │   ├── pages/       One folder per feature area
│   │   ├── components/  Shared UI (Button, TextField, SelectField, ConfirmDialog, ...)
│   │   ├── services/    Axios calls to the backend API
│   │   └── utils/       Shared formatting (currency, weight, dates)
│   └── .env.example
├── backend/             Express API
│   ├── src/
│   │   ├── routes/      One file per resource, wires auth + validation + controller
│   │   ├── controllers/ Thin HTTP layer — maps service errors to status codes
│   │   ├── services/    All business logic and Prisma queries live here
│   │   ├── validators/  Zod schemas for every request body/query
│   │   └── middleware/  authenticate, authorize, rate limiting, error handling
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts      Development-only sample data (refuses to run in production)
│   ├── scripts/         backup-db.sh / restore-db.sh
│   └── .env.example
├── DEPLOYMENT.md        Production deployment instructions
└── README.md            This file
```

## Prerequisites

- Node.js 20 or newer, npm 9+
- PostgreSQL 14 or newer, running locally or reachable over the network

---

## Quick start (local development)

```bash
git clone <your-repo-url> agri-business
cd agri-business
```

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Set up the database

```sql
-- in psql, as the postgres superuser
CREATE USER agri_user WITH PASSWORD 'agri_password';
CREATE DATABASE agri_business_db OWNER agri_user;
GRANT ALL PRIVILEGES ON DATABASE agri_business_db TO agri_user;
```
(Use your own username/password if you prefer — just make sure they match
`DATABASE_URL` in the next step.)

### 3. Configure environment variables

```bash
cd backend
cp .env.example .env
```
Open `.env` and set `DATABASE_URL` to match step 2, and set `JWT_SECRET` to
a real random value:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Paste the output in as `JWT_SECRET`. (In development the app will run with
a weak/placeholder secret and just warn you — it only *refuses* to start
with one in production.)

```bash
cd ../frontend
cp .env.example .env
```
The default `VITE_API_BASE_URL=http://localhost:5000/api` is correct for
local development as-is.

### 4. Apply database migrations and seed sample data

```bash
cd ../backend
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```
Seeding creates:
- An owner login: `owner@agribusiness.local` / `ChangeMe123!`
- A staff login: `staff@agribusiness.local` / `ChangeMe123!`
- Five sample staff members, four sample crops, one warehouse, default
  quality statuses, and default expense categories

**Change these passwords (or don't seed at all) before this ever touches
real data.** Seeding is blocked automatically if `NODE_ENV=production`.

### 5. Run the app

In one terminal:
```bash
cd backend
npm run dev
```
Backend: **http://localhost:5000** — health check at `/api/health`.

In a second terminal:
```bash
cd frontend
npm run dev
```
Frontend: **http://localhost:5173** — sign in with either seeded account.

---

## Verifying the setup

```bash
curl http://localhost:5000/api/health
```
should return `{"status":"ok", ...}`. Then open `http://localhost:5173` in
a browser, sign in as the owner, and confirm the dashboard loads with the
seeded crops/warehouse visible under Inventory.

## Useful scripts (run from `backend/`)

| Command | Purpose |
|---|---|
| `npm run dev` | Start the API with auto-reload |
| `npm run build` | Generate the Prisma Client and compile TypeScript to `dist/` |
| `npm start` | Run the compiled server (`dist/server.js`) — production |
| `npm run prisma:migrate` | Create/apply a migration in development |
| `npm run prisma:migrate:deploy` | Apply pending migrations in production — **never** `migrate dev` there |
| `npm run prisma:studio` | Browse the database at `http://localhost:5555` |
| `npm run prisma:seed` | Re-run the development seed (blocked in production) |
| `npm run db:backup` | Dump the database to `backend/backups/` |
| `npm run db:restore -- <file>` | Restore a backup (prompts for confirmation) |

And from `frontend/`:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally, for a final check |

---

## Security notes

- Every API route requires a valid JWT except `POST /api/auth/login`; most
  routes further require the `OWNER` role for anything financially
  sensitive (dashboard, reports, audit log, price adjustments, inventory
  adjustments, staff/payroll data) — see each `*.routes.ts` file's
  comments for the exact rule and reasoning.
- Passwords are hashed with bcrypt; there is no endpoint that returns a
  password hash under any circumstance.
- `JWT_SECRET` has no usable fallback in production — see
  `backend/src/config/env.ts`.
- Every amount shown to a user (purchase totals, farmer/buyer balances,
  inventory, profit/loss) is recalculated server-side from source records
  on every request — the frontend cannot submit a number and have it
  trusted as the final figure.
- Errors are centrally handled and never expose a raw database or stack
  trace message to the client (`backend/src/middleware/errorHandler.middleware.ts`).

## Production deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for exact, step-by-step instructions
covering the production database, backend, frontend, environment variables,
Prisma migrations, process management, and backups.
