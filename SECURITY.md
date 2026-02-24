# Security Policy

## Scope

This starter kit includes:

- email/password authentication with Better Auth
- approval-first onboarding (`member`, `admin`, `super-admin`)
- admin-protected management routes and server functions
- DB-backed email logs and password-reset flows

## Release Gate

`v0.0.1` release readiness requires all checks to pass:

- `pnpm release:audit:sqlite`
- `pnpm release:audit:postgres`

These include:

- static checks (`biome`, `tsc`, unit tests)
- naming checks
- security checks (route guard expectations + focused security tests)
- dependency audit enforcement (`moderate+` threshold)
- route/security E2E checks (Playwright)
- DB migration/integrity/smoke checks for both providers

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
