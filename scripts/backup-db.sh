#!/bin/bash

set -e

if [ "${DB_PROVIDER:-sqlite}" = "postgres" ]; then
  echo "Skipping sqlite backup because DB_PROVIDER=postgres"
  exit 0
fi

DB_FILE="${DB_FILE:-${DB_PATH:-./sqlite.db}}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
MAX_BACKUPS="${MAX_BACKUPS:-15}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/sqlite_backup_$TIMESTAMP.db"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_FILE" ]; then
  echo "Error: Database file '$DB_FILE' not found"
  exit 1
fi

echo "Creating backup of $DB_FILE..."
node scripts/sqlite-backup.js "$DB_FILE" "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
  ORIGINAL_SIZE=$(stat -f%z "$DB_FILE" 2>/dev/null || stat -c%s "$DB_FILE")
  BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE")

  if [ "$ORIGINAL_SIZE" -eq "$BACKUP_SIZE" ]; then
    echo "Backup created successfully: $BACKUP_FILE"
  else
    echo "Backup size mismatch: original=$ORIGINAL_SIZE backup=$BACKUP_SIZE"
    exit 1
  fi
else
  echo "Backup failed"
  exit 1
fi

KEEP_AFTER=$((MAX_BACKUPS + 1))
ls -t "$BACKUP_DIR"/sqlite_backup_*.db 2>/dev/null | tail -n +$KEEP_AFTER | xargs -r rm || true
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/sqlite_backup_*.db 2>/dev/null | wc -l)
echo "Backup complete ($BACKUP_COUNT backups total)"
