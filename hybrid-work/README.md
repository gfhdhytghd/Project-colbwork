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
