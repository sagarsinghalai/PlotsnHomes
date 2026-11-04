#!/bin/bash
# =============================================================================
# PlotsnHomes — live MySQL database backup (Hostinger VPS / Docker Compose)
#
# Dumps the production database from the MySQL container into
# /opt/plotsnhomes/backups/ as a timestamped, gzip-compressed .sql.gz file,
# then prunes old backups (keeps the most recent $KEEP). Credentials are read
# from the container's own environment — nothing is hardcoded here.
#
# Usage (on the server):
#   cd /opt/plotsnhomes && ./backup-db.sh
#
# Run this BEFORE any risky schema change (removing/renaming a column).
#
# To RESTORE a backup (overwrites the current data — be careful):
#   gunzip < backups/plotsnhomes-YYYYMMDD-HHMMSS.sql.gz \
#     | docker exec -i plotsnhomes-mysql-1 \
#         sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
# =============================================================================
set -euo pipefail

PROJECT_DIR="/opt/plotsnhomes"
BACKUP_DIR="$PROJECT_DIR/backups"
DB_CONTAINER="plotsnhomes-mysql-1"
KEEP=14   # how many recent backups to keep

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/plotsnhomes-$STAMP.sql.gz"

echo "==> Dumping database from $DB_CONTAINER ..."
docker exec "$DB_CONTAINER" sh -c \
  'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers --no-tablespaces "$MYSQL_DATABASE"' \
  | gzip > "$OUT"

echo "==> Saved:  $OUT"
echo "==> Size:   $(du -h "$OUT" | cut -f1)"

echo "==> Pruning old backups (keeping last $KEEP) ..."
ls -1t "$BACKUP_DIR"/plotsnhomes-*.sql.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

echo ""
echo "==> Current backups:"
ls -lh "$BACKUP_DIR"/plotsnhomes-*.sql.gz 2>/dev/null
