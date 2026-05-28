#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 /absolute/path/to/backup.sqlite" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

docker compose -f "${ROOT_DIR}/docker-compose.yml" stop web
docker compose -f "${ROOT_DIR}/docker-compose.yml" run --rm \
  -v "${BACKUP_FILE}:/restore/input.sqlite:ro" \
  web sh -lc 'cp /restore/input.sqlite /data/satoriops.sqlite && sqlite3 /data/satoriops.sqlite "PRAGMA integrity_check;"'
docker compose -f "${ROOT_DIR}/docker-compose.yml" start web

echo "Restore completed from ${BACKUP_FILE}"
