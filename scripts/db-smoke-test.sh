#!/usr/bin/env bash

set -euo pipefail

PROVIDER="${DB_PROVIDER:-sqlite}"

if [ "$PROVIDER" = "postgres" ]; then
  echo "DB smoke test (postgres)"
  pnpm db:apply-migrations
  pnpm db:check
  echo "DB smoke test complete"
  exit 0
fi

DB_FILE="${DB_PATH:-/tmp/ho-starter-kit-ci.sqlite}"

echo "DB smoke test (sqlite) using: ${DB_FILE}"

rm -f "${DB_FILE}" "${DB_FILE}-shm" "${DB_FILE}-wal"
mkdir -p "$(dirname "${DB_FILE}")"

echo "1) Apply migrations"
DB_PROVIDER=sqlite DB_PATH="${DB_FILE}" pnpm db:apply-migrations

echo "2) Integrity check"
DB_PROVIDER=sqlite DB_PATH="${DB_FILE}" pnpm db:check

echo "3) Re-run migrations for idempotency"
DB_PROVIDER=sqlite DB_PATH="${DB_FILE}" pnpm db:apply-migrations

echo "4) Final integrity check"
DB_PROVIDER=sqlite DB_PATH="${DB_FILE}" pnpm db:check

echo "DB smoke test complete"
