#!/usr/bin/env bash
set -euo pipefail

# Usage: POSTGRES_URL=postgres://user:pass@host:5432/db ./backup_db.sh /backups
# Requires: openssl, pg_dump

DEST_DIR=${1:-.}
TS=$(date +%Y%m%d_%H%M%S)
DB_URL=${POSTGRES_URL:-}

if [ -z "$DB_URL" ]; then
  echo "POSTGRES_URL not set" >&2
  exit 1
fi

mkdir -p "$DEST_DIR"
OUT_FILE="$DEST_DIR/nexus_backup_$TS.sql.gz"

echo "Dumping database..."
pg_dump --no-owner --no-privileges "$DB_URL" | gzip -c > "$OUT_FILE"
echo "Backup written to $OUT_FILE"

if [ -n "${BACKUP_ENCRYPT_PASS:-}" ]; then
  echo "Encrypting backup..."
  openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:"$BACKUP_ENCRYPT_PASS" -in "$OUT_FILE" -out "$OUT_FILE.enc"
  shred -u "$OUT_FILE" || rm -f "$OUT_FILE"
  echo "Encrypted backup: $OUT_FILE.enc"
fi

# Optionally prune old backups
find "$DEST_DIR" -name 'nexus_backup_*.sql.gz*' -type f -mtime +14 -print -delete || true


