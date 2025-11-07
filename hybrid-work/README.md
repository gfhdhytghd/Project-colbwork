# Hybrid Work Collaboration Platform

Monorepo for the hybrid work collaboration suite (IM, shared calendars, desk map) using Nuxt 3 and NestJS.

## Workspaces

- `apps/web` – Nuxt 3 frontend
- `apps/api` – NestJS backend
- `packages/shared` – shared TypeScript types
- `packages/ui` – shared Vue components
- `packages/eslint-config` – lint configuration

## Getting Started

- Install dependencies: `pnpm install`
- Start development stack (after scaffolding apps):
  - `pnpm --filter api dev`
  - `pnpm --filter web dev`

Docker and additional setup steps will be added as modules are implemented.

## User Accounts

### Bootstrapping data

1. Provision a PostgreSQL database and set `DATABASE_URL`.
2. Run `pnpm --filter @hybrid-work/api prisma:migrate deploy` (or `... migrate dev` locally).
3. Seed demo data plus credentials via `pnpm --filter @hybrid-work/api seed`.

### Default identities

- **Admin:** username `admin`, password `admin`. This role can access the `/admin` portal, manage users, and change passwords.
- **Members:** the seed creates `alice`/`alice@acme.com` and `bob`/`bob@acme.com` with password `password`. These represent typical workspace users.

### Authentication flow

- The web app exposes a `/login` screen. Users authenticate with `username + password`; successful logins store a JWT in the `hw_token` cookie.
- All API calls now require a `Bearer` token. The Nuxt client injects this header automatically via `useApi()`.
- The default layout shows the signed-in identity and provides a “退出” action to clear the token and return to `/login`.

### Admin portal

- Visit `/admin` while logged in as an admin to:
  - List, create, edit, or delete member accounts.
  - Set initial passwords for new members or rotate existing ones.
  - Change the admin’s own password (requires current password for confirmation).
- Additionally, you can reset (or recreate) the admin password from the backend with `pnpm --filter @hybrid-work/api reset-admin-password <newPassword>`. If the admin account was deleted accidentally, this command will recreate it automatically.

### Usage tips

- After account creation, members sign in through `/login` just like the admin.
- The old “Acting as demo user” switch has been removed; all calendar/chat/desk data now reflect the authenticated user automatically.
