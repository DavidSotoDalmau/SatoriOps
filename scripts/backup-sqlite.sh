#!/bin/sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backups"
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
BACKUP_FILE="${BACKUP_DIR}/satoriops-${TIMESTAMP}.sqlite"

mkdir -p "${BACKUP_DIR}"

docker compose -f "${ROOT_DIR}/docker-compose.yml" exec -T web sh -lc \
  'sqlite3 /data/satoriops.sqlite ".backup /tmp/satoriops-backup.sqlite" && cat /tmp/satoriops-backup.sqlite' \
  > "${BACKUP_FILE}"

echo "Backup written to ${BACKUP_FILE}"
