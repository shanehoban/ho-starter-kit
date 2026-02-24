# Deployment (Coolify + Nixpacks)

This template deploys with `nixpacks.toml` by default.

## Build method in Coolify

- Recommended: **Nixpacks** (auto-detects and uses `nixpacks.toml`)
- Optional: **Dockerfile** (repository includes a production Dockerfile)
- Docker Compose: use only when running app + Postgres as one stack

## What is and is not automatic

- `DB_PROVIDER` only selects app runtime behavior (`sqlite` vs `postgres`).
- Setting `DB_PROVIDER=postgres` does **not** create/start Postgres automatically.
- In non-compose app deploys (Nixpacks/Dockerfile), you must provide a separate Postgres service and set `DATABASE_URL`.

## Required env vars

- `DB_PROVIDER=sqlite` or `DB_PROVIDER=postgres`
- `BETTER_AUTH_SECRET=<strong random secret>` > Generate: openssl rand -base64 32
- `BETTER_AUTH_URL=https://your-domain.example`

For SQLite:

- `DB_PATH=/app/data/sqlite.db`
- `BACKUP_DIR=/app/data/backups` (recommended)
- Add persistent storage mount at `/app/data`
- No separate DB service is required.

For Postgres:

- `DATABASE_URL=postgres://...`
- Create a Coolify Postgres service (or use external managed Postgres) and point `DATABASE_URL` to it.
- No SQLite persistent volume is needed when `DB_PROVIDER=postgres`.

### Postgres URL examples

- Host runtime (`pnpm dev` locally): `postgres://postgres:postgres@localhost:5432/ho_starter_kit`
- App container in compose stack: `postgres://postgres:postgres@postgres:5432/ho_starter_kit`

## Startup flow

Container start runs:

1. `pnpm db:deploy-migrate`
2. `node .output/server/index.mjs`

`db:deploy-migrate` applies pending migrations for the selected provider.
For SQLite it also runs integrity checks and backups.

## Compose stack option (app + Postgres together)

If you deploy with Docker Compose and include both `app` and `postgres` services:

- Coolify will run both services from your compose file.
- App `DATABASE_URL` should use compose host `postgres` (service name), not `localhost`.
- Keep Postgres data on a persistent volume (for this repo: `postgres_data`).
- In Coolify, choose **Docker Compose** and set compose file/path to `docker-compose.postgres.yml`.
- Expose the `app` service on port `3000`.

### Compose env injection

`docker-compose.postgres.yml` uses `${VAR}` substitution. Set variables once in Coolify stack environment.

Required:

- `BETTER_AUTH_SECRET=...`
- `BETTER_AUTH_URL=https://your-app.example`
- `DB_PROVIDER=postgres`

Recommended explicit Postgres values:

- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=<strong password>`
- `POSTGRES_DB=ho_starter_kit`
- `DATABASE_URL=postgres://postgres:<strong password>@postgres:5432/ho_starter_kit`

If Postgres credentials/db name change, update `DATABASE_URL` to match.
