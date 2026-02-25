# ho-starter-kit

[![CI](https://github.com/shanehoban/ho-starter-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/shanehoban/ho-starter-kit/actions/workflows/ci.yml)

[Demo](https://hsk.shanehoban.com) | [Docs](https://hsk.shanehoban.com/docs)

TanStack Start + Better Auth + Drizzle starter with:

- default approval-based auth workflow (`member`, `admin`, `super-admin`)
- SQLite or Postgres support (out of the box for SQLite, opt-in for Postgres)
- reusable UI primitives and protected route patterns
- migration scripts ready for local + Coolify deploys

## Quick start

```bash
nvm use
pnpm install
cp .env.example .env
pnpm db:generate:sqlite
pnpm db:apply-migrations
pnpm dev
```

Open http://localhost:3000

## Environment variables

Required (all providers):

- `BETTER_AUTH_SECRET` > Generate: openssl rand -base64 32
- `BETTER_AUTH_URL` (for local: `http://localhost:3000`)
- `BETTER_AUTH_TRUSTED_ORIGINS` (optional comma-separated absolute origins)
- `CSP_SCRIPT_NONCE` (optional, recommended for production CSP nonce)
- `DB_PROVIDER` (`sqlite` or `postgres`)

SQLite:

- `DB_PATH=./sqlite.db`

Postgres:

- host runtime (pnpm dev): `DATABASE_URL=postgres://postgres:postgres@localhost:5432/ho_starter_kit`
- app container runtime (docker compose app service): `DATABASE_URL=postgres://postgres:postgres@postgres:5432/ho_starter_kit`

Optional:

- `EMAIL_PROVIDER` (`null` or `resend`)
- `RESEND_API_KEY` (required if `EMAIL_PROVIDER=resend`)
- `EMAIL_FROM` (required if `EMAIL_PROVIDER=resend`)
- `BACKUP_DIR`, `MAX_BACKUPS` (SQLite backup behavior)

Generate a Better Auth secret:

```bash
openssl rand -base64 48
# or
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

## DB provider switch

SQLite (default):

- `DB_PROVIDER=sqlite`
- `DB_PATH=./sqlite.db`

Postgres:

- `DB_PROVIDER=postgres`
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/ho_starter_kit` (for host runtime)
- run `pnpm db:generate:postgres` then `pnpm db:apply-migrations`
- `db:apply-migrations` reads `.env` automatically
- local postgres helper: `pnpm start:local:db`
- stop local postgres: `pnpm stop:local:db`
- run app in separate terminal: `pnpm dev`

## Useful commands

- `pnpm verify`
- `pnpm db:safe-migrate` (SQLite)
- `pnpm db:deploy-migrate`
- `pnpm db:smoke`

## Release audit (v0.0.1 gate)

Install Playwright once:

```bash
pnpm exec playwright install chromium
```

If your machine is missing browser libs:

```bash
sudo pnpm exec playwright install --with-deps chromium
```

Run full provider matrix locally:

```bash
pnpm release:audit
```

Limit stored local audit artifacts:

```bash
RELEASE_AUDIT_MAX_ARTIFACTS=10 pnpm release:audit
```

Or run each provider:

```bash
pnpm release:audit:sqlite
pnpm release:audit:postgres
```

If you need to verify DB/migrations only (skip E2E temporarily):

```bash
RELEASE_AUDIT_SKIP_E2E=1 pnpm release:audit
```

Audit policy:

- dependency audit enforcement fails on `moderate` and above
- explicit temporary exceptions live in `security/audit-allowlist.json`
- security guidance lives in `SECURITY.md`

## Coolify build path

- default: `Nixpacks` (`nixpacks.toml`)
- optional: `Dockerfile`
- sqlite on Coolify requires persistent storage mount at `/app/data`
- postgres path uses `DB_PROVIDER=postgres` + `DATABASE_URL` (no sqlite volume required)
- `DB_PROVIDER=postgres` does not provision Postgres automatically; create a separate Coolify Postgres service unless you deploy with Docker Compose stack mode
- Docker Compose stack mode can run app + Postgres together; in that mode use host `postgres` in `DATABASE_URL`
- for Compose stack mode on Coolify, select Docker Compose and set file/path to `docker-compose.postgres.yml`
- compose file supports `${VAR}` injection from Coolify stack envs (set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, Postgres vars, and `DATABASE_URL`)
- set `NODE_ENV` as runtime-only in Coolify (do not expose it at build-time as `production`)

## Optional advanced patterns from hobnb

Not enabled by default, but recommended when needed:

- migration history recovery guard in `scripts/apply-migrations.js` (SQLite path)
- structured audit-log diffs for admin actions
- hardened media upload pipeline (mime + signature checks + rollback)
