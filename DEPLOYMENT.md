# Deployment Guide — Agri Business Management System

This document gives exact, copy-pasteable steps to take this application from
source code to a running production deployment. It assumes a Linux server
(bare metal, VM, or equivalent) with `git`, `node` (v20+), `npm`, and
`postgresql-client` available. Everything here also maps directly onto a
managed platform (Render, Railway, Fly.io, a VPS behind nginx, etc.) — the
commands are the same either way; only *how* you run them long-term differs
(systemd/PM2 vs. the platform's own process manager).

Nothing in this guide requires committing a real secret anywhere. Every
credential is supplied at deploy time via environment variables.

---

## 1. Database

Use a dedicated PostgreSQL instance for production — never reuse a
developer's local database, and never let the application connect as a
superuser.

1. **Provision PostgreSQL 14+** — either a managed service (RDS, Cloud SQL,
   Supabase, Neon, Railway Postgres) or self-hosted:
   ```bash
   sudo apt install postgresql
   sudo systemctl enable --now postgresql
   ```

2. **Create a dedicated database and a least-privilege user** (run as the
   `postgres` superuser, once):
   ```sql
   CREATE DATABASE agri_business_prod;
   CREATE USER agri_prod_user WITH PASSWORD 'a-strong-generated-password';
   GRANT ALL PRIVILEGES ON DATABASE agri_business_prod TO agri_prod_user;
   \c agri_business_prod
   GRANT ALL ON SCHEMA public TO agri_prod_user;
   ```
   Generate the password with something like
   `openssl rand -base64 32` — never type a memorable password here.

3. **Restrict network access.** If self-hosting, bind PostgreSQL to
   `localhost` (or a private network) in `postgresql.conf` /
   `pg_hba.conf` and only allow the backend server to reach it. If using a
   managed provider, restrict its firewall/allowlist to the backend's IP.

4. **Enable TLS** if the database and backend are not on the same trusted
   private network — append `?sslmode=require` to the connection string.

The resulting connection string is what goes into `DATABASE_URL` in step 4
below. It is never written to disk anywhere except the server's own `.env`
file (which is not part of the repository).

---

## 2. Backend

1. **Get the code onto the server:**
   ```bash
   git clone <your-repo-url> agri-business
   cd agri-business/backend
   ```

2. **Install dependencies.** `postinstall` automatically runs
   `prisma generate`, so the Prisma Client is always in sync with the
   schema right after install:
   ```bash
   npm ci
   ```

3. **Create `backend/.env`** from the template and fill in real values —
   see [Section 4](#4-environment-variables):
   ```bash
   cp .env.example .env
   nano .env   # or your editor of choice
   ```

4. **Apply database migrations** — see [Section 5](#5-prisma-migrations).

5. **Build the TypeScript output:**
   ```bash
   npm run build
   ```
   This compiles `src/` to `dist/` and (re)generates the Prisma Client.

6. **Start the server** — see [Section 6](#6-production-startup) for how to
   keep it running under a process manager instead of a foreground shell.

The backend needs no reverse proxy to function, but in production you should
put one in front of it (nginx, Caddy, or your platform's load balancer) to
terminate TLS and forward `/api` (and `/uploads`) to the Node process on
`PORT`.

---

## 3. Frontend

The frontend is a static single-page app after building — it does not run a
Node server in production, it's just files served by any static file host
(nginx, Caddy, S3+CloudFront, Vercel, Netlify, etc.).

1. **Install dependencies:**
   ```bash
   cd agri-business/frontend
   npm ci
   ```

2. **Set the production API URL before building** — see the warning in
   [Section 4](#4-environment-variables). Either export it in the build
   shell/CI environment, or create `frontend/.env.production`:
   ```bash
   echo "VITE_API_BASE_URL=https://api.yourdomain.com/api" > .env.production
   ```

3. **Build:**
   ```bash
   npm run build
   ```
   Output lands in `frontend/dist/` — copy or point your static host at
   that directory.

4. **Configure SPA fallback routing.** This app uses client-side routing
   (React Router). The web server MUST serve `index.html` for any path it
   doesn't recognize as a real file, or refreshing on e.g. `/purchases/12`
   will 404. Examples:

   **nginx:**
   ```nginx
   server {
     listen 443 ssl;
     server_name app.yourdomain.com;
     root /var/www/agri-business/frontend/dist;

     location / {
       try_files $uri /index.html;
     }
   }
   ```

   **Netlify** (`frontend/public/_redirects`):
   ```
   /*  /index.html  200
   ```

   **Vercel** (`frontend/vercel.json`):
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```

---

## 4. Environment variables

Two separate `.env` files, one per app — never share values between them,
and never commit either. Templates live at `backend/.env.example` and
`frontend/.env.example`.

### Backend (`backend/.env`)

| Variable | Required | Notes |
|---|---|---|
| `PORT` | no (default 5000) | Port the Node process listens on. |
| `NODE_ENV` | **yes** | Must be exactly `production`. Enables strict `JWT_SECRET` validation and fuller request logs. |
| `CORS_ORIGIN` | **yes** | The exact frontend origin, e.g. `https://app.yourdomain.com` — no trailing slash, no wildcard. |
| `DATABASE_URL` | **yes** | PostgreSQL connection string from [Section 1](#1-database). |
| `JWT_SECRET` | **yes** | 32+ random characters. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. The app **refuses to start** in production if this is missing, short, or a known placeholder. |
| `JWT_EXPIRES_IN` | no (default `1d`) | Token lifetime, e.g. `1d`, `12h`. |

### Frontend (`frontend/.env` for dev, or a build-time env var in CI/hosting for prod)

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | **yes** | Full backend API base URL including `/api`, e.g. `https://api.yourdomain.com/api`. |

> **Vite bakes `VITE_*` variables into the built JS at build time, not at
> server start time.** Changing this on a server that's only serving an
> already-built `dist/` folder does nothing — you must rebuild. This is the
> single most common deployment mistake with this stack; if the deployed
> frontend is calling the wrong API, the fix is "rebuild with the right
> `VITE_API_BASE_URL`", not "restart the server."

### What must never be exposed

- Database passwords / `DATABASE_URL`
- `JWT_SECRET`
- Any real `.env` file (only `.env.example` templates belong in the repo —
  already enforced by `.gitignore`)
- Backup dump files (`backend/backups/`, also already git-ignored) — they
  contain full production data

---

## 5. Prisma migrations

**Never use `prisma migrate dev` in production** — it's an interactive,
development-only command that can prompt for destructive resets. Production
always uses `migrate deploy`, which only applies pending migrations and
never touches data outside of them.

1. **First deployment** (empty production database):
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
   This applies every migration in `prisma/migrations/` in order and
   records them in the `_prisma_migrations` table.

2. **Every subsequent deployment** that includes new migrations — run the
   same command again. It's idempotent: migrations already applied are
   skipped.
   ```bash
   npm run prisma:migrate:deploy
   ```

3. **Creating a new migration during development** (not on the production
   server — do this locally, commit the generated SQL, then deploy it):
   ```bash
   npx prisma migrate dev --name describe_the_change
   ```

4. **Never run `prisma migrate reset` against production** — it drops the
   entire database. It's a development-only command by design.

5. **Regenerating the Prisma Client** happens automatically via
   `postinstall` and `npm run build`; you don't need to run
   `prisma generate` manually in a normal deploy.

---

## 6. Production startup

Run the compiled server with a process manager so it restarts on crash and
on server reboot — never leave `node dist/server.js` running in a plain
foreground shell for a real deployment.

**Option A — systemd** (recommended for a VM/bare-metal server):

Create `/etc/systemd/system/agri-backend.service`:
```ini
[Unit]
Description=Agri Business Management System — backend
After=network.target postgresql.service

[Service]
Type=simple
WorkingDirectory=/opt/agri-business/backend
EnvironmentFile=/opt/agri-business/backend/.env
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=5
User=agri
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```
Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now agri-backend
sudo systemctl status agri-backend
journalctl -u agri-backend -f   # tail logs
```

**Option B — PM2** (simpler, works on any host with Node):
```bash
npm install -g pm2
cd backend
pm2 start dist/server.js --name agri-backend
pm2 save
pm2 startup   # follow the printed instructions to survive reboots
pm2 logs agri-backend
```

**Full deploy sequence, either option:**
```bash
cd backend
git pull
npm ci
npx prisma migrate deploy
npm run build
# then: systemctl restart agri-backend   (or)   pm2 restart agri-backend
```

The frontend has no process to start — see [Section 3](#3-frontend); just
rebuild and the static host serves the new `dist/` files.

**Post-deploy smoke test:**
```bash
curl https://api.yourdomain.com/api/health
# {"status":"ok","message":"Agri Business Management System backend is running.",...}
```

---

## 7. Basic backup procedure

Two scripts are provided in `backend/scripts/`.

### Manual backup
```bash
cd backend
export $(grep -v '^#' .env | xargs)   # load DATABASE_URL into the shell
npm run db:backup
# → backend/backups/agri_business_<timestamp>.dump.gz
```
Backups older than 14 days are pruned automatically each run (override with
`RETENTION_DAYS=30 npm run db:backup`). Point `BACKUP_DIR` at a mounted
volume or network share if you want backups to survive the server being
rebuilt: `BACKUP_DIR=/mnt/backups npm run db:backup`.

### Automate it (daily, 2 AM)
```bash
crontab -e
```
Add:
```
0 2 * * * cd /opt/agri-business/backend && export $(grep -v '^#' .env | xargs) && BACKUP_DIR=/mnt/backups npm run db:backup >> /var/log/agri-backup.log 2>&1
```

### Off-server copy
A backup that only lives on the same disk as the database isn't a real
backup. Sync the backup directory somewhere else on a schedule, e.g.:
```bash
rsync -av /mnt/backups/ user@offsite-host:/backups/agri-business/
# or: aws s3 sync /mnt/backups/ s3://your-backup-bucket/agri-business/
```

### Restore
```bash
cd backend
export $(grep -v '^#' .env | xargs)
npm run db:restore -- ./backups/agri_business_20260101-020000.dump.gz
```
This prompts for confirmation before overwriting the database at the
current `DATABASE_URL` — double-check that variable before typing `yes`.
Restore to a scratch database first if you just want to verify a backup is
valid, rather than restoring straight into production.
