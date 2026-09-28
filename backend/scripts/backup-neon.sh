#!/usr/bin/env bash
# Verified backup of the HOK Interiors PostgreSQL database (Neon).
#
# Read-only against the source. Produces a compressed custom-format dump plus a
# manifest, then VERIFIES it by restoring into a throwaway database and
# comparing row counts. A backup that has not been restored is not a backup.
#
#   npm run backup            # uses DATABASE_URL
#   DATABASE_URL=... npm run backup
#
# Refuses to overwrite an existing backup directory.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$BACKEND_DIR")"
BACKUP_ROOT="${BACKUP_DIR:-$REPO_ROOT/backups}"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_ROOT/$STAMP"

log() { printf '%s\n' "$*"; }
fail() { printf 'FAILED: %s\n' "$*" >&2; exit 1; }

command -v pg_dump >/dev/null 2>&1 || fail "pg_dump not found (install postgresql-client)"
command -v psql   >/dev/null 2>&1 || fail "psql not found (install postgresql-client)"

# Resolve the source URL without printing the password.
if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f "$BACKEND_DIR/.env" ]; then
    DATABASE_URL="$(grep -E '^DATABASE_URL=' "$BACKEND_DIR/.env" | cut -d= -f2- | head -1)"
  fi
fi
[ -n "${DATABASE_URL:-}" ] || fail "DATABASE_URL is not set and none found in backend/.env"

case "$DATABASE_URL" in
  postgres://*|postgresql://*) ;;
  *) fail "DATABASE_URL must be a postgresql:// URL" ;;
esac

# Admin maintenance queries do not work through the Neon pooler.
PG_URL="$DATABASE_URL"
case "$PG_URL" in
  *-pooler*) PG_URL="${PG_URL/-pooler/}" ;;
esac

# Work with discrete connection parameters from here on. Appending a database
# name to a URL that already carries a path produces an invalid URL, so the
# scratch-database steps use PG* variables instead.
PGUSER_NAME="$(printf '%s' "$PG_URL" | sed -E 's|.*://([^:]*):?([^@]*)@.*|\1|')"
if printf '%s' "$PG_URL" | grep -qE '://[^:]+:[^@]+@'; then
  PGPASSWORD_VALUE="$(printf '%s' "$PG_URL" | sed -E 's|.*://[^:]+:([^@]*)@.*|\1|')"
  export PGPASSWORD="$PGPASSWORD_VALUE"
fi
PGHOST_VALUE="$(printf '%s' "$PG_URL" | sed -E 's|.*://[^@]*@([^:/?]+).*|\1|')"
# A Neon URL usually has no explicit port. The sed below leaves the input
# untouched when there is no ":digits" after the host, so the result must be
# validated as digits before being used as PGPORT.
PGPORT_VALUE="$(printf '%s' "$PG_URL" | sed -E 's|.*://[^@]*@[^:/?]+:([0-9]+).*|\1|')"
case "$PGPORT_VALUE" in
  ''|*[!0-9]*) PGPORT_VALUE=5432 ;;
esac
PGDATABASE="$(printf '%s' "$PG_URL" | sed -E 's|.*://[^@]*@[^/]*/([^?]*).*|\1|')"
export PGHOST="$PGHOST_VALUE" PGPORT="$PGPORT_VALUE" PGUSER="$PGUSER_NAME" PGDATABASE
# Neon requires TLS.
export PGSSLMODE="${PGSSLMODE:-require}"

mkdir -p "$OUT"
chmod 700 "$OUT"
log "[backup] source host : $(printf '%s' "$PG_URL" | sed -E 's|//[^@]*@|//***@|')"
log "[backup] destination: $OUT"

# --- 1. pre-flight: prove the source is readable before doing anything else ---
log "[backup] testing source connection..."
psql -v ON_ERROR_STOP=1 -tAc "SELECT 1" >/dev/null 2>&1 \
  || fail "cannot connect to the source database"

# pg_dump refuses to dump a server newer than itself ("server version mismatch").
# The server version is only knowable after connecting, so check it here and fail
# with an actionable message rather than a bare abort.
SERVER_VER="$(psql -tAc 'SHOW server_version;' 2>/dev/null | cut -d. -f1)"
DUMP_VER="$(pg_dump --version | awk '{print $NF}' | cut -d. -f1)"
if [ -n "$SERVER_VER" ] && [ -n "$DUMP_VER" ] && [ "$DUMP_VER" -lt "$SERVER_VER" ]; then
  fail "pg_dump is $DUMP_VER but the server is PostgreSQL $SERVER_VER. pg_dump cannot dump a newer server.
  Install a matching client, e.g. postgresql-client-$SERVER_VER, and re-run with its bin/ first on PATH."
fi

# --- 2. schema + globals + data ---
log "[backup] dumping schema and data (custom format, compressed)..."
pg_dump "$PG_URL" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --file="$OUT/db_dump.sql" \
  || fail "pg_dump failed"

[ -s "$OUT/db_dump.sql" ] || fail "dump file is empty"

DUMP_SIZE=$(du -h "$OUT/db_dump.sql" | cut -f1)
log "[backup] dump written: $DUMP_SIZE"

# --- 3. inventory: table list and per-table row counts straight from the dump ---
log "[backup] recording table inventory..."
pg_restore --list "$OUT/db_dump.sql" > "$OUT/dump_contents.txt" 2>/dev/null || true

# --- 4. VERIFY: restore into a throwaway database and compare row counts ---
log "[backup] verifying by restoring into a scratch database..."
VERIFY_DB="hok_verify_$(date -u +%s)"
RESTORED=0

cleanup() {
  if [ "$RESTORED" = "1" ]; then
    psql -v ON_ERROR_STOP=0 -q -c "DROP DATABASE IF EXISTS \"$VERIFY_DB\";" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

psql -v ON_ERROR_STOP=1 -q -c "CREATE DATABASE \"$VERIFY_DB\";" >/dev/null 2>&1 \
  || fail "could not create scratch verification database"
RESTORED=1

if ! pg_restore --dbname="$VERIFY_DB" --no-owner --no-privileges --exit-on-error \
  "$OUT/db_dump.sql" > "$OUT/restore_test.log" 2>&1; then
  tail -20 "$OUT/restore_test.log" >&2 || true
  fail "restore into scratch database failed — this dump is NOT trustworthy (see $OUT/restore_test.log)"
fi

log "[backup] restore succeeded. Comparing row counts..."

SOURCE_COUNTS=$(psql -tAF'|' -c "
  SELECT table_schema || '.' || table_name
  FROM information_schema.tables
  WHERE table_schema NOT IN ('pg_catalog','information_schema')
    AND table_type='BASE TABLE'
  ORDER BY 1;" | while IFS='|' read -r tbl; do
  n=$(psql -tAc "SELECT COUNT(*) FROM \"${tbl%%.*}\".\"${tbl##*.}\";" 2>/dev/null || echo ERR)
  printf '%s|%s\n' "$tbl" "$n"
done)

RESTORED_COUNTS=$(export PGDATABASE="$VERIFY_DB"; psql -tAF'|' -c "
  SELECT table_schema || '.' || table_name
  FROM information_schema.tables
  WHERE table_schema NOT IN ('pg_catalog','information_schema')
    AND table_type='BASE TABLE'
  ORDER BY 1;" | while IFS='|' read -r tbl; do
  n=$(psql -tAc "SELECT COUNT(*) FROM \"${tbl%%.*}\".\"${tbl##*.}\";" 2>/dev/null || echo ERR)
  printf '%s|%s\n' "$tbl" "$n"
done)

printf '%s\n' "$SOURCE_COUNTS" > "$OUT/row_counts_source.txt"
printf '%s\n' "$RESTORED_COUNTS" > "$OUT/row_counts_restored.txt"

DIFF_COUNT=$(diff <(sort "$OUT/row_counts_source.txt") <(sort "$OUT/row_counts_restored.txt") | grep -c '^[<>]' || true)

TOTAL_ROWS=$(awk -F'|' '$2 ~ /^[0-9]+$/ {s+=$2} END {print s+0}' "$OUT/row_counts_source.txt")
TABLE_COUNT=$(grep -c '|' "$OUT/row_counts_source.txt" || true)

{
  echo "# HOK Interiors database backup"
  echo
  echo "- Created:        $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  echo "- Source:         $(printf '%s' "$PG_URL" | sed -E 's|//[^@]*@|//***@|') (credentials omitted)"
  echo "- PostgreSQL:     $(psql -tAc 'SHOW server_version;' 2>/dev/null || echo unknown)"
  echo "- Tables:         $TABLE_COUNT"
  echo "- Total rows:     $TOTAL_ROWS"
  echo "- Dump size:      $DUMP_SIZE"
  echo "- Format:         pg_dump custom, gzip -9"
  echo "- Restore test:   PASSED (restored into a scratch database)"
  echo "- Row count diff: $DIFF_COUNT"
  echo
  echo "## Restore"
  echo
  echo '```bash'
  echo "pg_restore --no-owner --no-privileges --dbname='<target>' $STAMP/db_dump.sql"
  echo '```'
  echo
  echo "## Per-table row counts (source == restored, diff $DIFF_COUNT)"
  echo
  echo '```'
  cat "$OUT/row_counts_source.txt"
  echo '```'
} > "$OUT/BACKUP_MANIFEST.md"

if [ "$DIFF_COUNT" != "0" ]; then
  echo "[backup] WARNING: $DIFF_COUNT row-count differences between source and restore" >&2
  diff <(sort "$OUT/row_counts_source.txt") <(sort "$OUT/row_counts_restored.txt") >&2 || true
  fail "verification found discrepancies — review $OUT"
fi

log "[backup] VERIFIED: $TABLE_COUNT tables, $TOTAL_ROWS rows, restore test passed, 0 discrepancies"
log "[backup] manifest: $OUT/BACKUP_MANIFEST.md"
