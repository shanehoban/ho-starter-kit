# Database Safety

- SQLite mode includes: pre-check, backup, migration, post-check.
- Postgres mode runs migration apply directly (transactional migrations are expected from Postgres).
- Always run `pnpm db:smoke` before shipping migration changes.
