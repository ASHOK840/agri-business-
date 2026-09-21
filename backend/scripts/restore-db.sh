#!/usr/bin/env bash
# Restores a backup produced by scripts/backup-db.sh.
#
# Usage:
#   ./scripts/restore-db.sh ./backups/agri_business_20260101-020000.dump.gz
#
# WARNING: this restores INTO the database pointed at by DATABASE_URL.
# --clean drops existing objects first, so this overwrites current data.
# Always double-check DATABASE_URL before running this against anything
# other than a deliberately empty/recovery database.

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set. Export it first." >&2
  exit 1
fi

FILE="${1:-}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Usage: $0 <path-to-backup.dump.gz>" >&2
  exit 1
fi

read -r -p "This will overwrite the database at DATABASE_URL with '$FILE'. Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

echo "Restoring ${FILE} ..."
gunzip -c "$FILE" | pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL"

echo "Restore complete."
