# Security Policy

## Scope

This starter kit includes:

- email/password authentication with Better Auth
- approval-first onboarding (`member`, `admin`, `super-admin`)
- admin-protected management routes and server functions
- DB-backed email logs and password-reset flows

## Release Gate

Release readiness requires all checks to pass:

- `pnpm release:audit:sqlite`
- `pnpm release:audit:postgres`

These include:

- static checks (`biome`, `tsc`, unit tests)
- naming checks
- security checks (route guard expectations + focused security tests)
- dependency audit enforcement for production and development dependencies (`moderate+` threshold; registry errors also fail)
- route/security E2E checks (Playwright)
- DB migration/integrity/smoke checks for both providers

## CI layout

Standalone CI runs tests once with coverage, type checks, lint, a production build, dependency auditing, and migration smoke tests for SQLite and Postgres. The runner is pinned to Ubuntu 24.04 to keep OS changes separate from application changes.

The monorepo PR workflow calls the reusable release-audit workflow. Its quality job checks and builds once; both database jobs download that build and run migrations, integrity checks and browser tests. Dependency auditing runs once in a separate job and writes a concise GitHub job summary. Test reports and coverage are uploaded as artifacts.

Local `release:audit:*` commands run the complete gate by default. `--skip-shared-checks` is for CI jobs that already passed the shared quality and audit checks and restored the production build. `security:check --skip-tests` runs the static policy checks after the full test suite has passed.

Security overrides live in `pnpm-workspace.yaml`. Remove an override when the parent package resolves a patched version itself. No audit exceptions are currently needed.

## Audit Exceptions

Exceptions must be explicit in `security/audit-allowlist.json` and include:

- advisory id
- module
- reason
- expiry date

Expired exceptions fail the audit.

## Operational Guidance

- Set a high-entropy `BETTER_AUTH_SECRET`.
- Set `BETTER_AUTH_URL` to the canonical public origin.
- Add `BETTER_AUTH_TRUSTED_ORIGINS` only when additional origins are required.
- Keep baseline HTTP security headers enabled via `nitro.config.ts`.
- Keep `EMAIL_PROVIDER=null` until a real provider is configured.
- Prefer HTTPS-only deployments with secure cookie settings at the edge/platform layer.

## Reporting

For security issues in downstream projects generated from this starter, coordinate fixes in both:

- consuming project repository
- `ho-starter-kit` source in this monorepo
