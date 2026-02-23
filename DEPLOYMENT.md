# Deployment (Coolify + Nixpacks)

This template deploys with `nixpacks.toml`.

## Required env vars

- `DB_PROVIDER=sqlite` or `DB_PROVIDER=postgres`
- `BETTER_AUTH_SECRET=<strong random secret>` > Generate: openssl rand -base64 32
- `BETTER_AUTH_URL=https://your-domain.example`

For SQLite:

- `DB_PATH=/app/data/sqlite.db`
- `BACKUP_DIR=/app/data/backups` (recommended)
- Add persistent storage mount at `/app/data`

For Postgres:

- `DATABASE_URL=postgres://...`
- If using Coolify Docker Compose, add a Postgres service and connect via internal host.

## Startup flow

Container start runs:

1. `pnpm db:deploy-migrate`
2. `node .output/server/index.mjs`

`db:deploy-migrate` applies pending migrations for the selected provider.
For SQLite it also runs integrity checks and backups.
