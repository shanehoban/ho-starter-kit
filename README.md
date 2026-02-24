# ho-starter-kit

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
- `DB_PROVIDER` (`sqlite` or `postgres`)

SQLite:

- `DB_PATH=./sqlite.db`

Postgres:

- `DATABASE_URL=postgres://user:password@host:5432/db_name`

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
- `DATABASE_URL=postgres://...`
- run `pnpm db:generate:postgres` then `pnpm db:apply-migrations`

## Useful commands

- `pnpm verify`
- `pnpm db:safe-migrate` (SQLite)
- `pnpm db:deploy-migrate`
- `pnpm db:smoke`

## Optional advanced patterns from hobnb

Not enabled by default, but recommended when needed:

- migration history recovery guard in `scripts/apply-migrations.js` (SQLite path)
- structured audit-log diffs for admin actions
- hardened media upload pipeline (mime + signature checks + rollback)

test