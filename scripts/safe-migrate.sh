#!/bin/bash

set -e

if [ "${DB_PROVIDER:-sqlite}" = "postgres" ]; then
  echo "Skipping sqlite safe migration wrapper because DB_PROVIDER=postgres"
  pnpm db:apply-migrations
  exit 0
fi

echo "SQLite safe migration"

echo "Step 1: Pre-migration integrity check"
node scripts/check-db-integrity.js

echo "Step 2: Backup database"
bash scripts/backup-db.sh

echo "Step 3: Apply migrations"
pnpm db:apply-migrations

echo "Step 4: Post-migration integrity check"
node scripts/check-db-integrity.js

echo "Migration completed successfully"
