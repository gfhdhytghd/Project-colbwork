# Hybrid Work Repository

This workspace contains multiple projects related to the Hybrid Work collaboration demo. The primary app lives in the `hybrid-work/` directory (Nested pnpm workspace with NestJS API + Nuxt frontend). Additional experiments may appear under `apps/`.

## Directory Overview

- `hybrid-work/` – main monorepo (Nuxt web client, NestJS API, shared packages).
- `apps/` – standalone experiments or legacy snapshots (content may vary per branch).
- `SETUP.md` – step-by-step instructions for deploying the full stack on a bare Linux host.

### Inside `hybrid-work/`

| Path | Description |
| ---- | ----------- |
| `apps/api` | NestJS 10 service powering auth, chat, calendar, desks, notifications. Uses Prisma + PostgreSQL. |
| `apps/web` | Nuxt 3 SPA/SSR frontend (Pinia, TailwindCSS). |
| `packages/shared` | Shared TypeScript types/utilities. |
| `packages/ui`, `packages/eslint-config` | Internal component library and lint config. |

Refer to `hybrid-work/README.md` for workspace-specific scripts and the authentication model.

## Quick Start

1. Install Node.js 20, pnpm 9, PostgreSQL 14+, and Redis 6+.
2. Follow `SETUP.md` for database provisioning, environment configuration, migrations, and seeding.
3. Run:
   ```bash
   # API
   cd hybrid-work/apps/api
   pnpm dev

   # Web
   cd ../web
   pnpm dev
   ```
4. Visit `http://localhost:3001/login` and sign in with `admin / admin` (after seeding or running `pnpm reset-admin-password admin`).

## Documentation

- **SETUP.md** – comprehensive bare-metal deployment guide (system deps, env vars, reverse proxy tips, troubleshooting).
- **hybrid-work/README.md** – workspace instructions, admin portal details, and maintenance commands.

Feel free to open issues or PRs if anything in the docs is unclear or missing.
