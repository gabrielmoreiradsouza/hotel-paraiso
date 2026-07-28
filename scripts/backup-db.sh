#!/usr/bin/env bash
# Backup do Postgres local — rodar na VPS via cron ou manualmente
# Usage: ./scripts/backup-db.sh
#
# Pré-requisito: Postgres rodando no Docker (hp-postgres container)
# O backup é salvo em /backups/ na VPS
#
# Para configurar cron na VPS:
#   crontab -e
#   0 3 * * * /path/to/backup-db.sh >> /var/log/backup-db.log 2>&1

set -euo pipefail

BACKUP_DIR="/backups/postgres"
CONTAINER="hp-postgres"
DB_NAME="hotel_paraiso"
DB_USER="hotel_paraiso"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hp-$DATE.sql.gz"
RETENTION_DAYS=30

# Create backup dir if needed
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# Dump and compress
docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Verify backup
SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
echo "[$(date)] Backup created: $BACKUP_FILE ($SIZE bytes)"

# Delete backups older than retention period
find "$BACKUP_DIR" -name "hp-*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
echo "[$(date)] Cleaned backups older than $RETENTION_DAYS days"

echo "[$(date)] Backup complete"
