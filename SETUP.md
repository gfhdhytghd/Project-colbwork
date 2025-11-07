# Hybrid Work – Bare-Metal Setup Guide

The instructions below walk through bringing up the full stack (PostgreSQL + NestJS API + Nuxt web app) on a fresh Linux host.

## 1. Prerequisites

Install the following base packages with your distro’s package manager:

```bash
sudo apt-get update
sudo apt-get install -y curl git build-essential python3 \
  postgresql postgresql-contrib redis-server
```

> The API requires PostgreSQL 14+ and Redis 6+ (Redis is used by background modules and future realtime features).

Install **Node.js 20 LTS** and **pnpm**:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pnpm
```

Verify:

```bash
node --version   # v20.x
pnpm --version   # 9.x
```

## 2. Clone the repository

```bash
git clone https://your.git.server/hybrid-work.git
cd hybrid-work
pnpm install
```

> The workspace uses a single `pnpm-lock.yaml`. Run `pnpm install` only at the repo root.

## 3. Provision PostgreSQL

### Option A: Native service

Create a database + user (you can reuse the default `postgres` superuser during development):

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE hybrid WITH LOGIN PASSWORD 'hybrid';
CREATE DATABASE hybrid OWNER hybrid;
GRANT ALL PRIVILEGES ON DATABASE hybrid TO hybrid;
SQL
```

Enable remote access if the API/web apps run on separate hosts:

1. Edit `/etc/postgresql/<version>/main/postgresql.conf` and ensure `listen_addresses = '*'`.
2. Edit `/etc/postgresql/<version>/main/pg_hba.conf` to allow your network, e.g.:
   ```
   host all all 0.0.0.0/0 scram-sha-256
   ```
3. Restart PostgreSQL: `sudo systemctl restart postgresql`.

### Option B: Docker container

If you prefer running PostgreSQL via Docker (common in CI or developer laptops):

```bash
docker run -d --name hybrid-postgres \
  -e POSTGRES_DB=hybrid \
  -e POSTGRES_USER=hybrid \
  -e POSTGRES_PASSWORD=hybrid \
  -p 5432:5432 \
  postgres:15
```

> Adjust the port mapping if 5432 is already in use. For production, attach a named volume to persist data (e.g., `-v hybrid_pg:/var/lib/postgresql/data`).

Redis can also run inside Docker:

```bash
docker run -d --name hybrid-redis -p 6379:6379 redis:7
```

Once the containers are up, use `DATABASE_URL=postgresql://hybrid:hybrid@localhost:5432/hybrid` and `REDIS_URL=redis://localhost:6379`.

## 4. Configure environment variables

Create API `.env` from the example:

```bash
cd apps/api
cp .env.example .env
```

Edit `.env` to match your database/Redis credentials:

```ini
DATABASE_URL=postgresql://hybrid:hybrid@localhost:5432/hybrid
REDIS_URL=redis://localhost:6379
JWT_SECRET=super-secret-string
```

For production hosting, place the same values in your process manager (systemd, PM2, Docker, etc.).

Optional: configure the Nuxt frontend’s public API base (default is `http://localhost:3000`). Either set an environment variable before starting the web app or create `apps/web/.env`:

```ini
NUXT_PUBLIC_API_BASE=https://api.your-domain.com
```

## 5. Generate Prisma client & run migrations

```bash
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate deploy   # use `migrate dev` for local dev
pnpm seed                    # creates admin + demo users, desks, etc.
```

If you skipped seeding earlier or need to recover the admin account, run:

```bash
pnpm reset-admin-password admin123
```

This command recreates `username=admin` if missing and sets the password you provide.

## 6. Start the services

### API (NestJS)

```bash
cd apps/api
pnpm dev          # hot reload (development)
# or
pnpm build && pnpm start   # production bundle
```

The API listens on `PORT` (default 3000). Verify:

```bash
curl http://localhost:3000/health
```

### Web (Nuxt 3)

```bash
cd apps/web
pnpm dev                     # http://localhost:3001 by default
# production
pnpm build && pnpm preview   # serve the built app
```

If the web app is hosted on a different domain/port than the API, ensure `NUXT_PUBLIC_API_BASE` points to the API’s reachable URL. The frontend keeps the JWT in a `hw_token` cookie; no server-side session storage is required.

## 7. First login & admin panel

1. Visit `http://<web-host>/login`.
2. Sign in with the default admin credentials (`admin / admin` if you seeded or used the reset command).
3. After login you can access `/admin` to:
   - Create member accounts.
   - Reset member passwords.
   - Change the admin password.

Members (e.g., `alice` / `password`) can log in via the same `/login` page and will see chat/calendar/office views scoped to their account.

## 8. Running behind a reverse proxy (optional)

For production you typically want nginx or Caddy to terminate TLS and proxy to the Node processes. Example nginx snippets:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name app.your-domain.com;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Remember to set `NUXT_PUBLIC_API_BASE=https://api.your-domain.com` so the web bundle calls the correct host.

## 9. Troubleshooting checklist

- `curl /health` fails → API isn’t running or port blocked.
- Login returns status 0 in browser → `NUXT_PUBLIC_API_BASE` still points to `localhost` from the user’s machine perspective.
- `pnpm prisma:migrate` errors → Database credentials or network are misconfigured.
- Demo/admin accounts missing → rerun `pnpm seed` or `pnpm reset-admin-password <pwd>`.

Once these steps are complete, you have a fully working Hybrid Work environment on any bare Linux box. Customize process managers (systemd/PM2), TLS, and monitoring as needed for production.
