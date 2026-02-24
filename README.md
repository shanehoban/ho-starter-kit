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

## Optional advanced patterns from hobnb

Not enabled by default, but recommended when needed:

- migration history recovery guard in `scripts/apply-migrations.js` (SQLite path)
- structured audit-log diffs for admin actions
- hardened media upload pipeline (mime + signature checks + rollback)
