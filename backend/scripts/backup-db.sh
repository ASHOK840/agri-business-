#!/usr/bin/env bash
# Basic PostgreSQL backup for the Agri Business Management System.
#
# Usage:
#   ./scripts/backup-db.sh
#   BACKUP_DIR=/var/backups/agri ./scripts/backup-db.sh
#
# Reads DATABASE_URL from the environment (export it, or run via
# `npm run db:backup` after loading backend/.env into your shell).
# Never hardcodes credentials — pg_dump reads them from the URL.
#
# Produces one gzip-compressed, timestamped custom-format dump per run
# and prunes anything older than RETENTION_DAYS (default 14).

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set. Export it first, e.g.:" >&2
  echo "  export \$(grep -v '^#' .env | xargs) && ./scripts/backup-db.sh" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="${BACKUP_DIR}/agri_business_${TIMESTAMP}.dump.gz"

mkdir -p "$BACKUP_DIR"

echo "Backing up database to ${OUT_FILE} ..."
# -F c = PostgreSQL's own compressed/custom format (best for restore
# flexibility with pg_restore); piped through gzip for an extra,
# portable layer that's easy to move/store off-box.
pg_dump "$DATABASE_URL" -F c | gzip > "$OUT_FILE"

echo "Backup complete: ${OUT_FILE} ($(du -h "$OUT_FILE" | cut -f1))"

echo "Removing backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name 'agri_business_*.dump.gz' -mtime "+${RETENTION_DAYS}" -print -delete

echo "Done."
