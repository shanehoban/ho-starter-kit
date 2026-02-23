#!/bin/bash

set -e

if [ "${DB_PROVIDER:-sqlite}" = "postgres" ]; then
  echo "Running postgres migrations"
  pnpm db:apply-migrations
  exit 0
fi

DB_FILE="${DB_FILE:-${DB_PATH:-./sqlite.db}}"

if [ ! -f "$DB_FILE" ]; then
  echo "No sqlite database found; applying initial migrations"
  pnpm db:apply-migrations
  exit 0
fi

echo "Existing sqlite database detected; running safe migration"
bash scripts/safe-migrate.sh
